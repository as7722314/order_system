import { OrderStatus } from "../utils/prismaEnums.js";
import { prisma } from "../utils/prisma.js";
import { databaseDateMonthRange, formatTaipeiDate, taipeiDayRange, taipeiMonthRange } from "../utils/time.js";

export async function getDailyReport(date: string) {
  const range = taipeiDayRange(date);
  const [orders, expenses] = await Promise.all([
    prisma.order.findMany({
      where: {
        status: OrderStatus.COMPLETED,
        deletedAt: null,
        completedAt: { gte: range.start, lt: range.end }
      },
      select: {
        totalAmount: true
      }
    }),
    prisma.expense.aggregate({
      where: {
        expenseDate: new Date(`${date}T00:00:00.000Z`),
        deletedAt: null
      },
      _sum: { amount: true }
    })
  ]);
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const totalExpense = expenses._sum.amount ?? 0;
  return {
    date,
    orderCount: orders.length,
    totalRevenue,
    totalExpense
  };
}

export async function getMonthlyReport(month: string) {
  const range = taipeiMonthRange(month);
  const expenseRange = databaseDateMonthRange(month);
  const [orders, expenses] = await Promise.all([
    prisma.order.findMany({
      where: {
        status: OrderStatus.COMPLETED,
        deletedAt: null,
        completedAt: { gte: range.start, lt: range.end }
      },
      select: {
        totalAmount: true,
        completedAt: true
      }
    }),
    prisma.expense.findMany({
      where: {
        expenseDate: { gte: expenseRange.start, lt: expenseRange.end },
        deletedAt: null
      },
      select: { amount: true, expenseDate: true, category: true }
    })
  ]);

  const byDate = new Map(range.days.map((date) => [date, { revenue: 0, expense: 0 }]));
  for (const order of orders) {
    const key = formatTaipeiDate(order.completedAt ?? new Date());
    const row = byDate.get(key);
    if (row) {
      row.revenue += order.totalAmount;
    }
  }
  for (const expense of expenses) {
    const key = expense.expenseDate.toISOString().slice(0, 10);
    const row = byDate.get(key);
    if (row) row.expense += expense.amount;
  }

  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const totalExpense = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const categories = new Map<string, { category: string; amount: number; count: number }>();
  for (const expense of expenses) {
    const category = expense.category;
    const row = categories.get(category) ?? { category, amount: 0, count: 0 };
    row.amount += expense.amount;
    row.count += 1;
    categories.set(category, row);
  }
  return {
    month,
    orderCount: orders.length,
    totalRevenue,
    totalExpense,
    expenseCategories: [...categories.values()].sort((a, b) => b.amount - a.amount || a.category.localeCompare(b.category)),
    daily: range.days.map((date) => {
      const row = byDate.get(date) ?? { revenue: 0, expense: 0 };
      return {
        date,
        revenue: row.revenue,
        expense: row.expense
      };
    })
  };
}

export async function getDashboardCharts(date: string) {
  const day = taipeiDayRange(date);
  const start = day.start.addDays(-29);
  const dates = Array.from({ length: 30 }, (_, index) => formatTaipeiDate(start.addDays(index)));
  const [orders, statuses] = await Promise.all([
    prisma.order.findMany({
      where: { status: OrderStatus.COMPLETED, deletedAt: null, completedAt: { gte: start, lt: day.end } },
      select: { totalAmount: true, completedAt: true }
    }),
    prisma.order.groupBy({
      by: ["status"],
      where: { deletedAt: null, createdAt: { gte: day.start, lt: day.end } },
      _count: { _all: true }
    })
  ]);
  const revenue = new Map(dates.map((key) => [key, 0]));
  for (const order of orders) {
    if (!order.completedAt) continue;
    const key = formatTaipeiDate(order.completedAt);
    if (revenue.has(key)) revenue.set(key, (revenue.get(key) ?? 0) + order.totalAmount);
  }
  return {
    date,
    daily: dates.map((key) => ({ date: key, revenue: revenue.get(key) ?? 0 })),
    orderStatuses: Object.values(OrderStatus).map((status) => ({
      status, count: statuses.find((row) => row.status === status)?._count._all ?? 0
    }))
  };
}
