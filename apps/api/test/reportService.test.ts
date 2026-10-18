import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({ order: { findMany: vi.fn(), groupBy: vi.fn() }, expense: { aggregate: vi.fn(), findMany: vi.fn() } }));
vi.mock("../src/utils/prisma.js", () => ({ prisma: db }));

import { getDailyReport, getDashboardCharts, getMonthlyReport } from "../src/services/reportService.js";

describe("revenue and recorded-cost reports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.order.groupBy.mockResolvedValue([]);
    db.order.findMany.mockResolvedValue([{ totalAmount: 100000, completedAt: new Date("2026-10-17T16:00:00.000Z") }]);
    db.expense.aggregate.mockResolvedValue({ _sum: { amount: 80000 } });
    db.expense.findMany.mockResolvedValue([
      { expenseDate: new Date("2026-10-18T00:00:00.000Z"), amount: 50000, category: "食材" },
      { expenseDate: new Date("2026-10-18T00:00:00.000Z"), amount: 30000, category: "租金" }
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
      expenseCategories: [{ category: "食材", amount: 50000, count: 1 }, { category: "租金", amount: 30000, count: 1 }],
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
      { expenseDate: new Date("2026-10-01T00:00:00.000Z"), amount: 500, category: "食材" },
      { expenseDate: new Date("2026-10-31T00:00:00.000Z"), amount: 700, category: "食材" }
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
    expect(report.expenseCategories).toEqual([]);
    expect(report.daily.every((row) => row.revenue === 0 && row.expense === 0)).toBe(true);
  });
});


describe("dashboard chart aggregates", () => {
  beforeEach(() => { vi.clearAllMocks(); });
  it("uses all recorded costs and keeps category totals consistent beyond one list page", async () => {
    db.order.findMany.mockResolvedValue([]);
    db.expense.findMany.mockResolvedValue(Array.from({ length: 151 }, (_, index) => ({ expenseDate: new Date("2026-10-18T00:00:00Z"), amount: 100, category: index < 120 ? "食材" : "租金" })));
    const report = await getMonthlyReport("2026-10");
    expect(report.totalExpense).toBe(15100);
    expect(report.expenseCategories).toEqual([{ category: "食材", amount: 12000, count: 120 }, { category: "租金", amount: 3100, count: 31 }]);
    expect(report.expenseCategories.reduce((sum, row) => sum + row.amount, 0)).toBe(report.totalExpense);
    expect(report).not.toHaveProperty("netProfit");
  });

  it("builds a 30-day Taipei calendar series across the year boundary and counts every order status", async () => {
    db.order.findMany.mockResolvedValue([
      { totalAmount: 100, completedAt: new Date("2025-12-12T16:00:00Z") },
      { totalAmount: 200, completedAt: new Date("2026-01-10T15:59:59Z") },
      { totalAmount: 300, completedAt: new Date("2026-01-10T16:00:00Z") }
    ]);
    db.order.groupBy.mockResolvedValue([{ status: "PENDING", _count: { _all: 3 } }, { status: "COMPLETED", _count: { _all: 112 } }]);
    const result = await getDashboardCharts("2026-01-10");
    expect(result.daily).toHaveLength(30);
    expect(result.daily[0]).toEqual({ date: "2025-12-12", revenue: 0 });
    expect(result.daily[1]).toEqual({ date: "2025-12-13", revenue: 100 });
    expect(result.daily.at(-1)).toEqual({ date: "2026-01-10", revenue: 200 });
    expect(result.daily.reduce((sum, row) => sum + row.revenue, 0)).toBe(300);
    expect(result.orderStatuses.find(row => row.status === "COMPLETED")?.count).toBe(112);
    expect(result.orderStatuses.reduce((sum, row) => sum + row.count, 0)).toBe(115);
    expect(db.order.findMany).toHaveBeenCalledWith({ where: { status: "COMPLETED", deletedAt: null, completedAt: { gte: new Date("2025-12-11T16:00:00Z"), lt: new Date("2026-01-10T16:00:00Z") } }, select: { totalAmount: true, completedAt: true } });
    expect(db.order.groupBy).toHaveBeenCalledWith({ by: ["status"], where: { deletedAt: null, createdAt: { gte: new Date("2026-01-09T16:00:00Z"), lt: new Date("2026-01-10T16:00:00Z") } }, _count: { _all: true } });
  });

  it("fills an empty period with zeroes instead of fake chart values", async () => {
    db.order.findMany.mockResolvedValue([]);
    db.order.groupBy.mockResolvedValue([]);
    const result = await getDashboardCharts("2026-10-18");
    expect(result.daily).toHaveLength(30);
    expect(result.daily.every(row => row.revenue === 0)).toBe(true);
    expect(result.orderStatuses.every(row => row.count === 0)).toBe(true);
  });
});
