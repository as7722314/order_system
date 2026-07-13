import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(12),
  JWT_EXPIRES_IN: z.string().default("7d"),
  LINE_CHANNEL_ID: z.string().optional().default(""),
  LINE_CHANNEL_SECRET: z.string().optional().default(""),
  LINE_LIFF_ID: z.string().optional().default(""),
  LINE_MESSAGING_CHANNEL_ACCESS_TOKEN: z.string().optional().default(""),
  LINE_ORDER_NOTIFICATION_TO: z.string().optional().default(""),
  LINE_ORDER_NOTIFICATION_ENABLED: z.enum(["true", "false"]).default("true"),
  CUSTOMER_WEB_URL: z.string().url().default("http://localhost:5173"),
  ADMIN_WEB_URL: z.string().url().default("http://localhost:5174"),
  CLOUDFLARE_PUBLIC_URL: z.union([z.string().url(), z.literal("")]).default(""),
  TZ: z.string().default("Asia/Taipei")
});

export const env = envSchema.parse(process.env);
