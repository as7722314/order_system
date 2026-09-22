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
        totalAmount: true,
        items: { select: { quantity: true, unitCostSnapshot: true } }
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
  const totalProductCost = orders.reduce(
    (orderSum, order) => orderSum + order.items.reduce(
      (itemSum, item) => itemSum + item.unitCostSnapshot * item.quantity,
      0
    ),
    0
  );
  const totalExpense = expenses._sum.amount ?? 0;
  return {
    date,
    orderCount: orders.length,
    totalRevenue,
    totalProductCost,
    totalExpense,
    netProfit: totalRevenue - totalProductCost - totalExpense
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
        completedAt: true,
        items: { select: { quantity: true, unitCostSnapshot: true } }
      }
    }),
    prisma.expense.findMany({
      where: {
        expenseDate: { gte: expenseRange.start, lt: expenseRange.end },
        deletedAt: null
      },
      select: { amount: true, expenseDate: true }
    })
  ]);

  const byDate = new Map(range.days.map((date) => [date, { revenue: 0, productCost: 0, expense: 0 }]));
  for (const order of orders) {
    const key = formatTaipeiDate(order.completedAt ?? new Date());
    const row = byDate.get(key);
    if (row) {
      row.revenue += order.totalAmount;
      row.productCost += order.items.reduce(
        (sum, item) => sum + item.unitCostSnapshot * item.quantity,
        0
      );
    }
  }
  for (const expense of expenses) {
    const key = formatTaipeiDate(expense.expenseDate);
    const row = byDate.get(key);
    if (row) row.expense += expense.amount;
  }

  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const totalProductCost = orders.reduce(
    (orderSum, order) => orderSum + order.items.reduce(
      (itemSum, item) => itemSum + item.unitCostSnapshot * item.quantity,
      0
    ),
    0
  );
  const totalExpense = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  return {
    month,
    orderCount: orders.length,
    totalRevenue,
    totalProductCost,
    totalExpense,
    netProfit: totalRevenue - totalProductCost - totalExpense,
    daily: range.days.map((date) => {
      const row = byDate.get(date) ?? { revenue: 0, productCost: 0, expense: 0 };
      return {
        date,
        revenue: row.revenue,
        productCost: row.productCost,
        expense: row.expense,
        netProfit: row.revenue - row.productCost - row.expense
      };
    })
  };
}
