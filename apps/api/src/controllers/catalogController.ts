import type { Request, Response } from "express";
import { ok } from "../utils/apiResponse.js";
import { AppError } from "../utils/AppError.js";
import { prisma } from "../utils/prisma.js";

async function withDefaultFlavorsForUnconfiguredProducts<T extends { productFlavors: unknown[] }>(products: T[]): Promise<T[]> {
  if (products.every((product) => product.productFlavors.length > 0)) return products;
  const activeFlavors = await prisma.flavor.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  return products.map((product) => {
    if (product.productFlavors.length > 0) return product;
    return {
      ...product,
      productFlavors: activeFlavors.map((flavor) => ({ flavorId: flavor.id, flavor, productId: "" }))
    };
  }) as T[];
}

export async function listPublicCategories(_req: Request, res: Response): Promise<Response> {
  const categories = await prisma.productCategory.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  });
  return ok(res, categories);
}

export async function listPublicProducts(req: Request, res: Response): Promise<Response> {
  const query = req.query as { categoryId?: string; keyword?: string };
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      category: { isActive: true },
      categoryId: query.categoryId,
      name: query.keyword ? { contains: query.keyword, mode: "insensitive" } : undefined
    },
    include: {
      category: true,
      productFlavors: {
        where: { flavor: { isActive: true } },
        include: { flavor: true }
      }
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  });
  return ok(res, await withDefaultFlavorsForUnconfiguredProducts(products));
}

export async function getPublicProduct(req: Request, res: Response): Promise<Response> {
  const product = await prisma.product.findFirst({
    where: { id: req.params.id, isActive: true, category: { isActive: true } },
    include: {
      category: true,
      productFlavors: {
        where: { flavor: { isActive: true } },
        include: { flavor: true }
      }
    }
  });
  if (!product) throw new AppError("RESOURCE_NOT_FOUND", "商品不存在", 404);
  const [productWithFlavors] = await withDefaultFlavorsForUnconfiguredProducts([product]);
  return ok(res, productWithFlavors);
}
