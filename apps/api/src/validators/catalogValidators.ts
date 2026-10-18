import { z } from "zod";

export const idParamSchema = z.object({ id: z.string().uuid() });

export const categorySchema = z.object({
  name: z.string().min(1).max(80),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true)
});

export const statusSchema = z.object({
  isActive: z.boolean()
});

export const productSchema = z.object({
  categoryId: z.string().uuid().optional(),
  name: z.string().min(1).max(120),
  description: z.string().max(1000).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  price: z.number().int().nonnegative(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  flavorIds: z.array(z.string().uuid()).optional()
});

export const flavorSchema = z.object({
  name: z.string().min(1).max(80),
  extraPrice: z.number().int().nonnegative().default(0),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true)
});

export const productFlavorSchema = z.object({
  flavorIds: z.array(z.string().uuid())
});

export const publicProductQuerySchema = z.object({
  categoryId: z.string().uuid().optional(),
  keyword: z.string().optional()
});
