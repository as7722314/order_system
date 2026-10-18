import type { OrderStatus } from "@prisma/client";
import { AppError } from "../utils/AppError.js";

const transitions: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ["PREPARING", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: []
};

export type OrderLineInput = {
  productId: string;
  quantity: number;
  flavorIds: string[];
  note?: string;
};

export type FlavorSnapshot = {
  flavorId: string;
  name: string;
  extraPrice: number;
};

export type CalculatedLine = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  flavorExtraAmount: number;
  subtotal: number;
  note?: string;
  flavors: FlavorSnapshot[];
};

export type CalculatedOrder = {
  subtotal: number;
  flavorExtraAmount: number;
  totalAmount: number;
  lines: CalculatedLine[];
};

export type CatalogProduct = {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
  productFlavors: {
    flavorId: string;
    flavor: {
      id: string;
      name: string;
      extraPrice: number;
      isActive: boolean;
    };
  }[];
};

export function ensureStatusTransition(current: OrderStatus, next: OrderStatus): void {
  if (!transitions[current].includes(next)) {
    if (current === "COMPLETED") {
      throw new AppError("ORDER_ALREADY_COMPLETED", "已完成訂單不可再修改", 409);
    }
    if (current === "CANCELLED") {
      throw new AppError("ORDER_ALREADY_CANCELLED", "已取消訂單不可再修改", 409);
    }
    throw new AppError("INVALID_ORDER_STATUS_TRANSITION", "訂單狀態轉換不允許", 409);
  }
}

export function calculateOrder(inputItems: OrderLineInput[], products: CatalogProduct[]): CalculatedOrder {
  if (inputItems.length === 0) {
    throw new AppError("VALIDATION_ERROR", "訂單至少需要一個商品", 422);
  }

  const productMap = new Map(products.map((product) => [product.id, product]));
  const lines = inputItems.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) {
      throw new AppError("RESOURCE_NOT_FOUND", "商品不存在", 404);
    }
    if (!product.isActive) {
      throw new AppError("PRODUCT_INACTIVE", "商品已停用", 409);
    }
    if (item.quantity < 1) {
      throw new AppError("VALIDATION_ERROR", "商品數量至少為 1", 422);
    }
    if (item.flavorIds.length > 2) {
      throw new AppError("INVALID_FLAVOR_SELECTION", "每項商品最多選擇兩個口味", 422);
    }
    if (new Set(item.flavorIds).size !== item.flavorIds.length) {
      throw new AppError("INVALID_FLAVOR_SELECTION", "同一個口味不可重複選擇", 422);
    }

    const flavorMap = new Map(product.productFlavors.map((productFlavor) => [productFlavor.flavorId, productFlavor.flavor]));
    const flavors = item.flavorIds.map((flavorId) => {
      const flavor = flavorMap.get(flavorId);
      if (!flavor) {
        throw new AppError("INVALID_FLAVOR_SELECTION", "口味不屬於該商品", 422);
      }
      if (!flavor.isActive) {
        throw new AppError("FLAVOR_INACTIVE", "口味已停用", 409);
      }
      return {
        flavorId: flavor.id,
        name: flavor.name,
        extraPrice: flavor.extraPrice
      };
    });

    const flavorExtraAmount = flavors.reduce((sum, flavor) => sum + flavor.extraPrice, 0);
    const subtotal = (product.price + flavorExtraAmount) * item.quantity;
    return {
      productId: product.id,
      productName: product.name,
      quantity: item.quantity,
      unitPrice: product.price,
      flavorExtraAmount,
      subtotal,
      note: item.note,
      flavors
    };
  });

  const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const flavorExtraAmount = lines.reduce((sum, line) => sum + line.flavorExtraAmount * line.quantity, 0);
  return {
    subtotal,
    flavorExtraAmount,
    totalAmount: subtotal + flavorExtraAmount,
    lines
  };
}

