import type { Request, Response } from "express";
import { ok } from "../utils/apiResponse.js";
import { AppError } from "../utils/AppError.js";
import { prisma } from "../utils/prisma.js";

function toExpenseDate(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

export async function listExpenses(req: Request, res: Response): Promise<Response> {
  const query = req.query as unknown as { date?: string; page: number; pageSize: number };
  const where = {
    expenseDate: query.date ? toExpenseDate(query.date) : undefined,
    deletedAt: null
  };
  const [total, items] = await Promise.all([
    prisma.expense.count({ where }),
    prisma.expense.findMany({
      where,
      orderBy: { expenseDate: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize
    })
  ]);
  return ok(res, { total, items });
}

export async function createExpense(req: Request, res: Response): Promise<Response> {
  if (!req.user) throw new AppError("UNAUTHORIZED", "需要登入", 401);
  const body = req.body as { expenseDate: string; name: string; amount: number; note?: string };
  const expense = await prisma.expense.create({
    data: {
      expenseDate: toExpenseDate(body.expenseDate),
      name: body.name,
      amount: body.amount,
      note: body.note,
      createdById: req.user.id
    }
  });
  return ok(res, expense, 201);
}

export async function updateExpense(req: Request, res: Response): Promise<Response> {
  const body = req.body as { expenseDate: string; name: string; amount: number; note?: string };
  const expense = await prisma.expense.update({
    where: { id: req.params.id },
    data: {
      expenseDate: toExpenseDate(body.expenseDate),
      name: body.name,
      amount: body.amount,
      note: body.note
    }
  });
  return ok(res, expense);
}

export async function deleteExpense(req: Request, res: Response): Promise<Response> {
  const expense = await prisma.expense.update({
    where: { id: req.params.id },
    data: { deletedAt: new Date() }
  });
  return ok(res, expense);
}

