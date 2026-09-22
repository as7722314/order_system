import type { Request, Response } from "express";
import { ok } from "../utils/apiResponse.js";
import { AppError } from "../utils/AppError.js";
import { prisma } from "../utils/prisma.js";

type PushTokenBody = {
  token: string;
  platform: "android" | "ios";
};

export async function registerAdminPushToken(req: Request, res: Response): Promise<Response> {
  if (!req.user) throw new AppError("UNAUTHORIZED", "需要登入", 401);
  const { token, platform } = req.body as PushTokenBody;

  await prisma.adminPushToken.upsert({
    where: { token },
    update: { userId: req.user.id, platform },
    create: { userId: req.user.id, token, platform }
  });

  return ok(res, { registered: true });
}

export async function unregisterAdminPushToken(req: Request, res: Response): Promise<Response> {
  if (!req.user) throw new AppError("UNAUTHORIZED", "需要登入", 401);
  const { token } = req.body as PushTokenBody;

  await prisma.adminPushToken.deleteMany({
    where: { userId: req.user.id, token }
  });

  return ok(res, { registered: false });
}
