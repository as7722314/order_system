import type { Request, Response } from "express";
import { getDailyReport, getDashboardCharts, getMonthlyReport } from "../services/reportService.js";
import { ok } from "../utils/apiResponse.js";

export async function dailyReport(req: Request, res: Response): Promise<Response> {
  const { date } = req.query as { date: string };
  return ok(res, await getDailyReport(date));
}

export async function monthlyReport(req: Request, res: Response): Promise<Response> {
  const { month } = req.query as { month: string };
  return ok(res, await getMonthlyReport(month));
}

export async function dashboardCharts(req: Request, res: Response): Promise<Response> {
  const { date } = req.query as { date: string };
  return ok(res, await getDashboardCharts(date));
}
