import { describe, expect, it } from "vitest";
import { calculateOrder, ensureStatusTransition, type CatalogProduct } from "../src/services/orderRules.js";
import { OrderStatus } from "../src/utils/prismaEnums.js";

const product: CatalogProduct = {
  id: "product-1",
  name: "雞腿飯",
  price: 120,
  isActive: true,
  productFlavors: [
    {
      flavorId: "flavor-1",
      flavor: { id: "flavor-1", name: "加辣", extraPrice: 0, isActive: true }
    },
    {
      flavorId: "flavor-2",
      flavor: { id: "flavor-2", name: "加蛋", extraPrice: 15, isActive: true }
    }
  ]
};

describe("order rules", () => {
  it("calculates backend totals from product and flavor snapshots", () => {
    const result = calculateOrder([{ productId: product.id, quantity: 2, flavorIds: ["flavor-2"] }], [product]);
    expect(result.subtotal).toBe(240);
    expect(result.flavorExtraAmount).toBe(30);
    expect(result.totalAmount).toBe(270);
  });

  it("rejects more than two flavors", () => {
    expect(() => calculateOrder([{ productId: product.id, quantity: 1, flavorIds: ["a", "b", "c"] }], [product]))
      .toThrow("每項商品最多選擇兩個口味");
  });

  it("rejects duplicated flavors", () => {
    expect(() => calculateOrder([{ productId: product.id, quantity: 1, flavorIds: ["flavor-1", "flavor-1"] }], [product]))
      .toThrow("同一個口味不可重複選擇");
  });

  it("rejects inactive product and inactive flavor", () => {
    expect(() => calculateOrder([{ productId: product.id, quantity: 1, flavorIds: [] }], [{ ...product, isActive: false }]))
      .toThrow("商品已停用");
    expect(() => calculateOrder(
      [{ productId: product.id, quantity: 1, flavorIds: ["flavor-1"] }],
      [{ ...product, productFlavors: [{ ...product.productFlavors[0], flavor: { ...product.productFlavors[0].flavor, isActive: false } }] }]
    )).toThrow("口味已停用");
  });

  it("enforces product-flavor relation", () => {
    expect(() => calculateOrder([{ productId: product.id, quantity: 1, flavorIds: ["flavor-x"] }], [product]))
      .toThrow("口味不屬於該商品");
  });

  it("enforces allowed status transitions", () => {
    expect(() => ensureStatusTransition(OrderStatus.PENDING, OrderStatus.PREPARING)).not.toThrow();
    expect(() => ensureStatusTransition(OrderStatus.COMPLETED, OrderStatus.CANCELLED)).toThrow("已完成訂單不可再修改");
    expect(() => ensureStatusTransition(OrderStatus.PENDING, OrderStatus.READY)).toThrow("訂單狀態轉換不允許");
  });
});




