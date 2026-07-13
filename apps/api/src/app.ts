import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { adminRoutes } from "./routes/adminRoutes.js";
import { authRoutes } from "./routes/authRoutes.js";
import { orderRoutes } from "./routes/orderRoutes.js";
import { publicRoutes } from "./routes/publicRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { ok } from "./utils/apiResponse.js";

export function createApp() {
  const app = express();
  app.set("trust proxy", 1);
  const allowedOrigins = new Set([
    env.CUSTOMER_WEB_URL,
    env.ADMIN_WEB_URL,
    env.CLOUDFLARE_PUBLIC_URL,
    "http://localhost",
    "http://127.0.0.1",
    "https://messenger-char-drawings-soccer.trycloudflare.com"
  ].filter(Boolean));

  app.use(helmet());
  app.use(cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Not allowed by CORS"));
    }
  }));
  app.use(express.json({ limit: "1mb" }));
  app.use(rateLimit({ windowMs: 60_000, limit: 120 }));
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

  app.get("/api/health", (_req, res) => ok(res, { status: "ok" }));
  app.use("/api", authRoutes);
  app.use("/api", publicRoutes);
  app.use("/api", orderRoutes);
  app.use("/api", adminRoutes);
  app.use(errorHandler);

  return app;
}




