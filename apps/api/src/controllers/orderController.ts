import type { Request, Response } from "express";
import type { OrderStatus as OrderStatusType, Prisma } from "@prisma/client";
import { broadcastNewOrderEvent } from "../services/adminOrderEventService.js";
import { notifyNewOrder } from "../services/lineOrderNotificationService.js";
import { calculateOrder, ensureStatusTransition, type CatalogProduct, type OrderLineInput } from "../services/orderRules.js";
import { ok } from "../utils/apiResponse.js";
import { AppError } from "../utils/AppError.js";
import { createOrderNumber } from "../utils/orderNumber.js";
import { OrderStatus } from "../utils/prismaEnums.js";
import { prisma } from "../utils/prisma.js";
import { taipeiDayRange } from "../utils/time.js";

const orderInclude = {
  items: {
    include: { flavors: true }
  }
} satisfies Prisma.OrderInclude;

export async function createOrder(req: Request, res: Response): Promise<Response> {
  if (!req.user) throw new AppError("UNAUTHORIZED", "需要登入", 401);
  const body = req.body as {
    customerPhone: string;
    note?: string;
    items: OrderLineInput[];
  };
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) throw new AppError("UNAUTHORIZED", "登入資訊無效", 401);
  const customerName = user.displayName?.trim() || "LINE 使用者";
  const productIds = [...new Set(body.items.map((item) => item.productId))];
  const result = await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: user.id }, data: { phone: body.customerPhone } });
    const products = await tx.product.findMany({
      where: { id: { in: productIds } },
      include: {
        productFlavors: {
          include: { flavor: true }
        }
      }
    }) as CatalogProduct[];
    const activeFlavors = products.some((product) => product.productFlavors.length === 0)
      ? await tx.flavor.findMany({ where: { isActive: true } })
      : [];
    const productsForCalculation = products.map((product) => {
      if (product.productFlavors.length > 0) return product;
      return {
        ...product,
        productFlavors: activeFlavors.map((flavor) => ({ flavorId: flavor.id, flavor }))
      };
    });
    const calculated = calculateOrder(body.items, productsForCalculation);
    let orderNumber = createOrderNumber();
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const existing = await tx.order.findUnique({ where: { orderNumber } });
      if (!existing) break;
      orderNumber = createOrderNumber();
      if (attempt === 2) throw new AppError("DUPLICATE_ORDER_NUMBER", "訂單編號產生失敗", 500);
    }
    const order = await tx.order.create({
      data: {
        orderNumber,
        userId: req.user?.id,
        customerName,
        customerPhone: body.customerPhone,
        pickupTime: null,
        subtotal: calculated.subtotal,
        flavorExtraAmount: calculated.flavorExtraAmount,
        totalAmount: calculated.totalAmount,
        note: body.note,
        items: {
          create: calculated.lines.map((line) => ({
            productId: line.productId,
            productNameSnapshot: line.productName,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            flavorExtraAmount: line.flavorExtraAmount,
            subtotal: line.subtotal,
            note: line.note,
            flavors: {
              create: line.flavors.map((flavor) => ({
                flavorId: flavor.flavorId,
                flavorNameSnapshot: flavor.name,
                extraPriceSnapshot: flavor.extraPrice
              }))
            }
          }))
        }
      }
    });
    return {
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: order.totalAmount,
      notification: {
        orderNumber: order.orderNumber,
        customerName,
        customerPhone: body.customerPhone,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt.toISOString(),
        note: body.note,
        items: calculated.lines.map((line) => ({
          productName: line.productName,
          quantity: line.quantity,
          subtotal: line.subtotal,
          flavors: line.flavors.map((flavor) => flavor.name),
          note: line.note
        }))
      }
    };
  });
  broadcastNewOrderEvent({
    orderNumber: result.notification.orderNumber,
    customerName: result.notification.customerName,
    customerPhone: result.notification.customerPhone,
    totalAmount: result.notification.totalAmount,
    createdAt: result.notification.createdAt
  });
  void notifyNewOrder(result.notification).catch((error: unknown) => {
    console.warn("[line-order-notification] failed to send new order notification", error);
  });
  return ok(res, { orderNumber: result.orderNumber, status: result.status, totalAmount: result.totalAmount }, 201);
}

export async function listMyOrders(req: Request, res: Response): Promise<Response> {
  if (!req.user) throw new AppError("UNAUTHORIZED", "需要登入", 401);
  const orders = await prisma.order.findMany({
    where: { userId: req.user.id, deletedAt: null },
    include: orderInclude,
    orderBy: { createdAt: "desc" }
  });
  return ok(res, orders);
}

export async function getMyOrderByNumber(req: Request, res: Response): Promise<Response> {
  if (!req.user) throw new AppError("UNAUTHORIZED", "需要登入", 401);
  const order = await prisma.order.findFirst({
    where: { orderNumber: req.params.orderNumber, userId: req.user.id, deletedAt: null },
    include: orderInclude
  });
  if (!order) throw new AppError("RESOURCE_NOT_FOUND", "訂單不存在", 404);
  return ok(res, order);
}

export async function lookupOrder(req: Request, res: Response): Promise<Response> {
  const { orderNumber, phoneLast3 } = req.body as { orderNumber: string; phoneLast3: string };
  const order = await prisma.order.findUnique({ where: { orderNumber }, include: orderInclude });
  if (!order || order.deletedAt || !order.customerPhone.endsWith(phoneLast3)) {
    throw new AppError("RESOURCE_NOT_FOUND", "查無訂單", 404);
  }
  return ok(res, {
    orderNumber: order.orderNumber,
    createdAt: order.createdAt,
    customerName: order.customerName,
    items: order.items,
    totalAmount: order.totalAmount,
    pickupTime: order.pickupTime,
    status: order.status,
    cancelReason: order.cancelReason
  });
}


export async function createAdminBackfillOrder(req: Request, res: Response): Promise<Response> {
  const body = req.body as {
    customerName: string;
    customerPhone: string;
    note?: string;
    items: OrderLineInput[];
  };
  const productIds = [...new Set(body.items.map((item) => item.productId))];
  const completedAt = new Date();
  const order = await prisma.$transaction(async (tx) => {
    const products = await tx.product.findMany({
      where: { id: { in: productIds } },
      include: {
        productFlavors: {
          include: { flavor: true }
        }
      }
    }) as CatalogProduct[];
    const activeFlavors = products.some((product) => product.productFlavors.length === 0)
      ? await tx.flavor.findMany({ where: { isActive: true } })
      : [];
    const productsForCalculation = products.map((product) => {
      if (product.productFlavors.length > 0) return product;
      return {
        ...product,
        productFlavors: activeFlavors.map((flavor) => ({ flavorId: flavor.id, flavor }))
      };
    });
    const calculated = calculateOrder(body.items, productsForCalculation);
    let orderNumber = createOrderNumber();
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const existing = await tx.order.findUnique({ where: { orderNumber } });
      if (!existing) break;
      orderNumber = createOrderNumber();
      if (attempt === 2) throw new AppError("DUPLICATE_ORDER_NUMBER", "訂單編號產生失敗", 500);
    }
    return tx.order.create({
      data: {
        orderNumber,
        customerName: body.customerName,
        customerPhone: body.customerPhone,
        pickupTime: null,
        status: OrderStatus.COMPLETED,
        subtotal: calculated.subtotal,
        flavorExtraAmount: calculated.flavorExtraAmount,
        totalAmount: calculated.totalAmount,
        note: body.note,
        completedAt,
        items: {
          create: calculated.lines.map((line) => ({
            productId: line.productId,
            productNameSnapshot: line.productName,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            flavorExtraAmount: line.flavorExtraAmount,
            subtotal: line.subtotal,
            note: line.note,
            flavors: {
              create: line.flavors.map((flavor) => ({
                flavorId: flavor.flavorId,
                flavorNameSnapshot: flavor.name,
                extraPriceSnapshot: flavor.extraPrice
              }))
            }
          }))
        }
      },
      include: orderInclude
    });
  });
  return ok(res, order, 201);
}
export async function listAdminOrders(req: Request, res: Response): Promise<Response> {
  const query = req.query as unknown as {
    status?: OrderStatusType;
    date?: string;
    keyword?: string;
    deleted?: "active" | "deleted" | "all";
    page: number;
    pageSize: number;
  };
  const range = query.date ? taipeiDayRange(query.date) : undefined;
  const deletedAt = query.deleted === "deleted" ? { not: null } : query.deleted === "all" ? undefined : null;
  const where: Prisma.OrderWhereInput = {
    status: query.status,
    createdAt: range ? { gte: range.start, lt: range.end } : undefined,
    deletedAt,
    OR: query.keyword ? [
      { orderNumber: { contains: query.keyword, mode: "insensitive" } },
      { customerName: { contains: query.keyword, mode: "insensitive" } },
      { customerPhone: { contains: query.keyword, mode: "insensitive" } }
    ] : undefined
  };
  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize
    })
  ]);
  return ok(res, { total, items: orders });
}

export async function getAdminOrder(req: Request, res: Response): Promise<Response> {
  const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: orderInclude });
  if (!order) throw new AppError("RESOURCE_NOT_FOUND", "訂單不存在", 404);
  return ok(res, order);
}

export async function updateOrderStatus(req: Request, res: Response): Promise<Response> {
  const { status } = req.body as { status: OrderStatusType };
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) throw new AppError("RESOURCE_NOT_FOUND", "訂單不存在", 404);
  if (order.deletedAt) throw new AppError("ORDER_DELETED", "已刪除訂單不可修改", 409);
  ensureStatusTransition(order.status, status);
  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      status,
      completedAt: status === OrderStatus.COMPLETED ? new Date() : order.completedAt
    }
  });
  return ok(res, updated);
}

export async function cancelOrder(req: Request, res: Response): Promise<Response> {
  if (!req.user) throw new AppError("UNAUTHORIZED", "需要登入", 401);
  const { reason } = req.body as { reason: string };
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) throw new AppError("RESOURCE_NOT_FOUND", "訂單不存在", 404);
  if (order.deletedAt) throw new AppError("ORDER_DELETED", "已刪除訂單不可修改", 409);
  ensureStatusTransition(order.status, OrderStatus.CANCELLED);
  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: OrderStatus.CANCELLED,
      cancelReason: reason,
      cancelledAt: new Date(),
      cancelledById: req.user.id
    }
  });
  return ok(res, updated);
}

export async function deleteOrder(req: Request, res: Response): Promise<Response> {
  if (!req.user) throw new AppError("UNAUTHORIZED", "需要登入", 401);
  const { reason } = req.body as { reason?: string };
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) throw new AppError("RESOURCE_NOT_FOUND", "訂單不存在", 404);
  if (order.deletedAt) throw new AppError("ORDER_ALREADY_DELETED", "訂單已刪除", 409);
  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      deletedAt: new Date(),
      deletedById: req.user.id,
      deletedReason: reason?.trim() || null
    }
  });
  return ok(res, updated);
}

export async function restoreOrder(req: Request, res: Response): Promise<Response> {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) throw new AppError("RESOURCE_NOT_FOUND", "訂單不存在", 404);
  if (!order.deletedAt) throw new AppError("ORDER_NOT_DELETED", "訂單尚未刪除", 409);
  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      deletedAt: null,
      deletedById: null,
      deletedReason: null
    }
  });
  return ok(res, updated);
}
