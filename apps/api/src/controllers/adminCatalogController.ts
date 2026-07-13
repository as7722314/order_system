import type { Request, Response } from "express";
import { ok } from "../utils/apiResponse.js";
import { AppError } from "../utils/AppError.js";
import { prisma } from "../utils/prisma.js";

const defaultCategoryName = "預設商品";

const productInclude = { category: true, productFlavors: { include: { flavor: true } } } as const;

type ProductBody = {
  categoryId?: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price: number;
  sortOrder: number;
  isActive: boolean;
  flavorIds?: string[];
};

async function getDefaultCategoryId(): Promise<string> {
  const existing = await prisma.productCategory.findFirst({ where: { name: defaultCategoryName } });
  if (existing) return existing.id;
  const category = await prisma.productCategory.create({
    data: { name: defaultCategoryName, sortOrder: 0, isActive: true }
  });
  return category.id;
}

function cleanProductBody(body: ProductBody) {
  return {
    name: body.name,
    description: body.description,
    imageUrl: body.imageUrl || undefined,
    price: body.price,
    sortOrder: body.sortOrder,
    isActive: body.isActive
  };
}

async function resolveProductFlavorIds(flavorIds?: string[]): Promise<string[]> {
  const uniqueFlavorIds = flavorIds ? [...new Set(flavorIds)] : undefined;
  if (!uniqueFlavorIds) {
    const activeFlavors = await prisma.flavor.findMany({ where: { isActive: true }, select: { id: true } });
    return activeFlavors.map((flavor) => flavor.id);
  }
  const existing = await prisma.flavor.count({ where: { id: { in: uniqueFlavorIds } } });
  if (existing !== uniqueFlavorIds.length) {
    throw new AppError("RESOURCE_NOT_FOUND", "部分口味不存在", 404);
  }
  return uniqueFlavorIds;
}

export async function listCategories(_req: Request, res: Response): Promise<Response> {
  return ok(res, await prisma.productCategory.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }));
}

export async function createCategory(req: Request, res: Response): Promise<Response> {
  return ok(res, await prisma.productCategory.create({ data: req.body }), 201);
}

export async function updateCategory(req: Request, res: Response): Promise<Response> {
  return ok(res, await prisma.productCategory.update({ where: { id: req.params.id }, data: req.body }));
}

export async function updateCategoryStatus(req: Request, res: Response): Promise<Response> {
  const { isActive } = req.body as { isActive: boolean };
  return ok(res, await prisma.productCategory.update({ where: { id: req.params.id }, data: { isActive } }));
}

export async function listProducts(_req: Request, res: Response): Promise<Response> {
  return ok(res, await prisma.product.findMany({
    include: productInclude,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  }));
}

export async function createProduct(req: Request, res: Response): Promise<Response> {
  const body = req.body as ProductBody;
  const [categoryId, flavorIds] = await Promise.all([getDefaultCategoryId(), resolveProductFlavorIds(body.flavorIds)]);
  const product = await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: { ...cleanProductBody(body), category: { connect: { id: body.categoryId ?? categoryId } } }
    });
    if (flavorIds.length > 0) {
      await tx.productFlavor.createMany({
        data: flavorIds.map((flavorId) => ({ productId: created.id, flavorId })),
        skipDuplicates: true
      });
    }
    return tx.product.findUniqueOrThrow({ where: { id: created.id }, include: productInclude });
  });
  return ok(res, product, 201);
}

export async function updateProduct(req: Request, res: Response): Promise<Response> {
  const body = req.body as ProductBody;
  const flavorIds = await resolveProductFlavorIds(body.flavorIds);
  const product = await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: req.params.id },
      data: body.categoryId
        ? { ...cleanProductBody(body), category: { connect: { id: body.categoryId } } }
        : cleanProductBody(body)
    });
    await tx.productFlavor.deleteMany({ where: { productId: req.params.id } });
    if (flavorIds.length > 0) {
      await tx.productFlavor.createMany({
        data: flavorIds.map((flavorId) => ({ productId: req.params.id, flavorId })),
        skipDuplicates: true
      });
    }
    return tx.product.findUniqueOrThrow({ where: { id: req.params.id }, include: productInclude });
  });
  return ok(res, product);
}

export async function deleteProduct(req: Request, res: Response): Promise<Response> {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product) throw new AppError("RESOURCE_NOT_FOUND", "商品不存在", 404);
  await prisma.product.delete({ where: { id: product.id } });
  return ok(res, { id: product.id, deleted: true });
}

export async function updateProductStatus(req: Request, res: Response): Promise<Response> {
  const { isActive } = req.body as { isActive: boolean };
  return ok(res, await prisma.product.update({ where: { id: req.params.id }, data: { isActive } }));
}

export async function listFlavors(_req: Request, res: Response): Promise<Response> {
  return ok(res, await prisma.flavor.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }));
}

export async function createFlavor(req: Request, res: Response): Promise<Response> {
  return ok(res, await prisma.flavor.create({ data: req.body }), 201);
}

export async function updateFlavor(req: Request, res: Response): Promise<Response> {
  return ok(res, await prisma.flavor.update({ where: { id: req.params.id }, data: req.body }));
}

export async function updateFlavorStatus(req: Request, res: Response): Promise<Response> {
  const { isActive } = req.body as { isActive: boolean };
  return ok(res, await prisma.flavor.update({ where: { id: req.params.id }, data: { isActive } }));
}

export async function setProductFlavors(req: Request, res: Response): Promise<Response> {
  const productId = req.params.id;
  const { flavorIds } = req.body as { flavorIds: string[] };
  const uniqueFlavorIds = await resolveProductFlavorIds(flavorIds);
  await prisma.$transaction([
    prisma.productFlavor.deleteMany({ where: { productId } }),
    prisma.productFlavor.createMany({
      data: uniqueFlavorIds.map((flavorId) => ({ productId, flavorId })),
      skipDuplicates: true
    })
  ]);
  return ok(res, { productId, flavorIds: uniqueFlavorIds });
}

