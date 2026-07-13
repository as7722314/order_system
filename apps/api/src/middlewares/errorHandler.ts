import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
import { fail } from "../utils/apiResponse.js";

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): Response {
  if (error instanceof ZodError) {
    return fail(res, "VALIDATION_ERROR", "輸入資料不正確", 422, error.issues);
  }

  if (error instanceof AppError) {
    return fail(res, error.code, error.message, error.status, error.details);
  }

  const details = env.NODE_ENV === "production" ? [] : [{ message: error instanceof Error ? error.message : "Unknown error" }];
  return fail(res, "INTERNAL_SERVER_ERROR", "伺服器發生錯誤", 500, details);
}
