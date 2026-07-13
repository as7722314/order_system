import type { Request, Response } from "express";
import { addAdminOrderEventClient } from "../services/adminOrderEventService.js";
import { AppError } from "../utils/AppError.js";
import { UserRole } from "../utils/prismaEnums.js";
import { verifyAccessToken } from "../utils/jwt.js";

export function streamAdminOrderEvents(req: Request, res: Response): void {
  const token = typeof req.query.token === "string" ? req.query.token : undefined;
  if (!token) throw new AppError("UNAUTHORIZED", "需要登入", 401);

  const payload = verifyAccessToken(token);
  if (payload.role !== UserRole.ADMIN) throw new AppError("FORBIDDEN", "權限不足", 403);

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no"
  });
  res.write(`event: connected\ndata: ${JSON.stringify({ ok: true })}\n\n`);

  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };
  const removeClient = addAdminOrderEventClient(send);
  const heartbeat = setInterval(() => {
    res.write(`event: ping\ndata: ${JSON.stringify({ at: new Date().toISOString() })}\n\n`);
  }, 25_000);

  req.on("close", () => {
    clearInterval(heartbeat);
    removeClient();
  });
}

