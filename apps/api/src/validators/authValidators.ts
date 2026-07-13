import { z } from "zod";

export const adminLoginSchema = z.object({
  account: z.string().min(1),
  password: z.string().min(1)
});

export const lineLoginSchema = z.object({
  idToken: z.string().min(1)
});
