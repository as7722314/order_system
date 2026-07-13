import { Router } from "express";
import {
  createOrder,
  getMyOrderByNumber,
  listMyOrders,
  lookupOrder
} from "../controllers/orderController.js";
import { requireAuth } from "../middlewares/auth.js";
import { validateBody } from "../middlewares/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createOrderSchema, lookupOrderSchema } from "../validators/orderValidators.js";

export const orderRoutes = Router();

orderRoutes.post("/orders", requireAuth, validateBody(createOrderSchema), asyncHandler(createOrder));
orderRoutes.get("/orders/my", requireAuth, asyncHandler(listMyOrders));
orderRoutes.get("/orders/:orderNumber", requireAuth, asyncHandler(getMyOrderByNumber));
orderRoutes.post("/orders/lookup", validateBody(lookupOrderSchema), asyncHandler(lookupOrder));
