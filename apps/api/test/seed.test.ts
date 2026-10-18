import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  product: { count: vi.fn(), upsert: vi.fn() },
  productCategory: { upsert: vi.fn() },
  flavor: { upsert: vi.fn() },
  productFlavor: { deleteMany: vi.fn(), createMany: vi.fn() },
  user: { upsert: vi.fn() }
}));
vi.mock("../src/utils/prisma.js", () => ({ prisma: db }));
vi.mock("../src/utils/password.js", () => ({ hashPassword: vi.fn().mockResolvedValue("initial-hash") }));

import { seedAdmin, seedCatalog } from "../prisma/seed.js";
import { hashPassword } from "../src/utils/password.js";

describe("deployment bootstrap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
    db.user.upsert.mockResolvedValue({ id: "admin-1" });
    vi.mocked(hashPassword).mockResolvedValue("initial-hash");
  });
  afterEach(() => vi.restoreAllMocks());

  it("preserves existing menu prices and flavor selections on deployment", async () => {
    db.product.count.mockResolvedValue(3);
    await seedCatalog();
    expect(db.product.upsert).not.toHaveBeenCalled();
    expect(db.productCategory.upsert).not.toHaveBeenCalled();
    expect(db.flavor.upsert).not.toHaveBeenCalled();
    expect(db.productFlavor.deleteMany).not.toHaveBeenCalled();
    expect(db.productFlavor.createMany).not.toHaveBeenCalled();
  });

  it("still bootstraps a database without any products", async () => {
    db.product.count.mockResolvedValue(0);
    await seedCatalog();
    expect(db.product.upsert).toHaveBeenCalledTimes(2);
    expect(db.productFlavor.createMany).toHaveBeenCalledOnce();
  });

  it("initializes an admin without overwriting an existing password or display name", async () => {
    await seedAdmin();
    expect(db.user.upsert).toHaveBeenCalledWith({
      where: { lineUserId: "admin-seed" },
      update: {},
      create: expect.objectContaining({ role: "ADMIN", passwordHash: "initial-hash" })
    });
  });
});
