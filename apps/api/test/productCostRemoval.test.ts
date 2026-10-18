import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  product: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), findUniqueOrThrow: vi.fn() },
  productCategory: { findFirst: vi.fn() },
  productFlavor: { deleteMany: vi.fn() },
  flavor: { count: vi.fn() },
  $transaction: vi.fn()
}));
vi.mock("../src/utils/prisma.js", () => ({ prisma: db }));

import { createProduct, listProducts, updateProduct } from "../src/controllers/adminCatalogController.js";
import { productSchema } from "../src/validators/catalogValidators.js";

const storedProduct = { id: "product-1", name: "蔥油餅", price: 100, cost: 40, productFlavors: [] };
const response = () => ({ status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() }) as unknown as Response;

describe("retired product-cost setting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.$transaction.mockImplementation(async (action) => action(db));
    db.productCategory.findFirst.mockResolvedValue({ id: "category-1" });
    db.flavor.count.mockResolvedValue(0);
    db.product.create.mockResolvedValue(storedProduct);
    db.product.update.mockResolvedValue(storedProduct);
    db.product.findUniqueOrThrow.mockResolvedValue(storedProduct);
    db.product.findMany.mockResolvedValue([storedProduct]);
  });

  it("lists products without exposing the retired setting", async () => {
    const res = response();
    await listProducts({} as Request, res);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: "product-1", name: "蔥油餅", price: 100, productFlavors: [] }] });
  });

  it("creates products without requiring or writing a cost", async () => {
    const res = response();
    const body = productSchema.parse({ name: "蔥油餅", price: 100, flavorIds: [] });
    await createProduct({ body } as Request, res);
    expect(db.product.create.mock.calls[0][0].data).not.toHaveProperty("cost");
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: "product-1", name: "蔥油餅", price: 100, productFlavors: [] } });
  });

  it("ignores legacy cost inputs without overwriting stored historical values", async () => {
    const body = productSchema.parse({ name: "蔥油餅", price: 100, cost: 999, flavorIds: [] });
    expect(body).not.toHaveProperty("cost");
    const res = response();
    await updateProduct({ body, params: { id: "product-1" } } as unknown as Request, res);
    expect(db.product.update.mock.calls[0][0].data).not.toHaveProperty("cost");
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: "product-1", name: "蔥油餅", price: 100, productFlavors: [] } });
  });
});
