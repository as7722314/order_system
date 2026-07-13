import type { Request, Response } from "express";
import { env } from "../config/env.js";
import { ok } from "../utils/apiResponse.js";
import { AppError } from "../utils/AppError.js";
import { signAccessToken } from "../utils/jwt.js";
import { verifyPassword } from "../utils/password.js";
import { UserRole } from "../utils/prismaEnums.js";
import { prisma } from "../utils/prisma.js";

type LineVerifyResponse = {
  sub: string;
  name?: string;
};

export async function adminLogin(req: Request, res: Response): Promise<Response> {
  const { account, password } = req.body as { account: string; password: string };
  const normalizedAccount = account.trim();
  const user = await prisma.user.findFirst({
    where: {
      displayName: { equals: normalizedAccount, mode: "insensitive" },
      role: UserRole.ADMIN,
      isActive: true
    }
  });
  if (!user?.passwordHash) {
    throw new AppError("UNAUTHORIZED", "帳號或密碼錯誤", 401);
  }
  const passwordOk = await verifyPassword(password, user.passwordHash);
  if (!passwordOk) {
    throw new AppError("UNAUTHORIZED", "帳號或密碼錯誤", 401);
  }
  return ok(res, {
    accessToken: signAccessToken({ sub: user.id, role: user.role }),
    user: { id: user.id, displayName: user.displayName, role: user.role }
  });
}

export async function lineLogin(req: Request, res: Response): Promise<Response> {
  const { idToken } = req.body as { idToken: string };
  if (!env.LINE_CHANNEL_ID) {
    throw new AppError("VALIDATION_ERROR", "尚未設定 LINE_CHANNEL_ID", 500);
  }
  const body = new URLSearchParams({ id_token: idToken, client_id: env.LINE_CHANNEL_ID });
  const response = await fetch("https://api.line.me/oauth2/v2.1/verify", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body
  });
  if (!response.ok) {
    throw new AppError("UNAUTHORIZED", "LINE 登入驗證失敗", 401);
  }
  const profile = await response.json() as LineVerifyResponse;
  const user = await prisma.user.upsert({
    where: { lineUserId: profile.sub },
    update: { displayName: profile.name ?? null },
    create: {
      lineUserId: profile.sub,
      displayName: profile.name ?? null,
      role: UserRole.CUSTOMER
    }
  });
  return ok(res, {
    accessToken: signAccessToken({ sub: user.id, role: user.role }),
    user: { id: user.id, displayName: user.displayName, role: user.role }
  });
}


