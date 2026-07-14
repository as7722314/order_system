import type { Request, Response } from "express";
import { getStoreStatus, setStoreOpen } from "../services/storeSettingService.js";
import { ok } from "../utils/apiResponse.js";

export async function getPublicStoreStatus(_req: Request, res: Response): Promise<Response> {
  return ok(res, await getStoreStatus());
}

export async function getAdminStoreStatus(_req: Request, res: Response): Promise<Response> {
  return ok(res, await getStoreStatus());
}

export async function updateAdminStoreStatus(req: Request, res: Response): Promise<Response> {
  const body = req.body as { isOpen: boolean };
  return ok(res, await setStoreOpen(body.isOpen));
}