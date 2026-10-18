import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({ order: { findMany: vi.fn() }, expense: { aggregate: vi.fn(), findMany: vi.fn() } }));
vi.mock("../src/utils/prisma.js", () => ({ prisma: db }));

import { getDailyReport, getMonthlyReport } from "../src/services/reportService.js";

describe("revenue and recorded-cost reports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.order.findMany.mockResolvedValue([{ totalAmount: 100000, completedAt: new Date("2026-10-17T16:00:00.000Z") }]);
    db.expense.aggregate.mockResolvedValue({ _sum: { amount: 80000 } });
    db.expense.findMany.mockResolvedValue([
      { expenseDate: new Date("2026-10-18T00:00:00.000Z"), amount: 50000 },
      { expenseDate: new Date("2026-10-18T00:00:00.000Z"), amount: 30000 }
    ]);
  });

  it("returns revenue and all recorded costs without calculating profit or product costs", async () => {
    expect(await getDailyReport("2026-10-18")).toEqual({ date: "2026-10-18", orderCount: 1, totalRevenue: 100000, totalExpense: 80000 });
    expect(db.order.findMany).toHaveBeenCalledWith({
      where: { status: "COMPLETED", deletedAt: null, completedAt: { gte: new Date("2026-10-17T16:00:00.000Z"), lt: new Date("2026-10-18T16:00:00.000Z") } },
      select: { totalAmount: true }
    });
    expect(db.expense.aggregate).toHaveBeenCalledWith({
      where: { expenseDate: new Date("2026-10-18T00:00:00.000Z"), deletedAt: null }, _sum: { amount: true }
    });
  });

  it("keeps the monthly summary consistent with daily details", async () => {
    const report = await getMonthlyReport("2026-10");
    expect(report).toEqual({
      month: "2026-10", orderCount: 1, totalRevenue: 100000, totalExpense: 80000,
      daily: expect.any(Array)
    });
    expect(report.daily).toHaveLength(31);
    expect(report.daily.find((row) => row.date === "2026-10-18")).toEqual({ date: "2026-10-18", revenue: 100000, expense: 80000 });
    expect(report.daily.reduce((sum, row) => sum + row.revenue, 0)).toBe(report.totalRevenue);
    expect(report.daily.reduce((sum, row) => sum + row.expense, 0)).toBe(report.totalExpense);
    expect(db.expense.findMany.mock.calls[0][0].where).toEqual({
      expenseDate: { gte: new Date("2026-10-01T00:00:00.000Z"), lt: new Date("2026-11-01T00:00:00.000Z") }, deletedAt: null
    });
  });

  it("handles the first and last calendar days without shifting recorded costs", async () => {
    db.order.findMany.mockResolvedValue([
      { totalAmount: 100, completedAt: new Date("2026-09-30T16:00:00.000Z") },
      { totalAmount: 200, completedAt: new Date("2026-10-31T15:59:59.999Z") }
    ]);
    db.expense.findMany.mockResolvedValue([
      { expenseDate: new Date("2026-10-01T00:00:00.000Z"), amount: 500 },
      { expenseDate: new Date("2026-10-31T00:00:00.000Z"), amount: 700 }
    ]);
    const report = await getMonthlyReport("2026-10");
    expect(report.daily[0]).toEqual({ date: "2026-10-01", revenue: 100, expense: 500 });
    expect(report.daily.at(-1)).toEqual({ date: "2026-10-31", revenue: 200, expense: 700 });
  });

  it("returns zero totals for empty periods and still shows costs on days with no sales", async () => {
    db.order.findMany.mockResolvedValue([]);
    expect(await getDailyReport("2026-10-18")).toEqual({ date: "2026-10-18", orderCount: 0, totalRevenue: 0, totalExpense: 80000 });
    db.expense.aggregate.mockResolvedValue({ _sum: { amount: null } });
    db.expense.findMany.mockResolvedValue([]);
    expect(await getDailyReport("2026-10-18")).toEqual({ date: "2026-10-18", orderCount: 0, totalRevenue: 0, totalExpense: 0 });
    const report = await getMonthlyReport("2026-10");
    expect(report.totalExpense).toBe(0);
    expect(report.daily.every((row) => row.revenue === 0 && row.expense === 0)).toBe(true);
  });
});
