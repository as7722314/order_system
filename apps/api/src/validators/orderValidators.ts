import { z } from "zod";
import { OrderStatus } from "../utils/prismaEnums.js";

export const createOrderSchema = z.object({
  customerPhone: z.string().regex(/^09\d{8}$/),
  note: z.string().max(500).optional(),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().min(1),
      flavorIds: z.array(z.string().uuid()).max(2).default([]),
      note: z.string().max(300).optional()
    })
  ).min(1)
});

export const lookupOrderSchema = z.object({
  orderNumber: z.string().min(8),
  phoneLast3: z.string().regex(/^\d{3}$/)
});

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus)
});

export const cancelOrderSchema = z.object({
  reason: z.string().min(1).max(300)
});

export const deleteOrderSchema = z.object({
  reason: z.string().max(300).optional()
});

export const adminOrderQuerySchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  keyword: z.string().optional(),
  deleted: z.enum(["active", "deleted", "all"]).default("active"),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20)
});
