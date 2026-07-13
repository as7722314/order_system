import { Router } from "express";
import { adminLogin, lineLogin } from "../controllers/authController.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateBody } from "../middlewares/validate.js";
import { adminLoginSchema, lineLoginSchema } from "../validators/authValidators.js";

export const authRoutes = Router();

authRoutes.post("/auth/line", validateBody(lineLoginSchema), asyncHandler(lineLogin));
authRoutes.post("/admin/auth/login", validateBody(adminLoginSchema), asyncHandler(adminLogin));
