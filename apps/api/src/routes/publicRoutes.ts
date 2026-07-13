import { Router } from "express";
import { getPublicProduct, listPublicCategories, listPublicProducts } from "../controllers/catalogController.js";
import { validateQuery } from "../middlewares/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { publicProductQuerySchema } from "../validators/catalogValidators.js";

export const publicRoutes = Router();

publicRoutes.get("/categories", asyncHandler(listPublicCategories));
publicRoutes.get("/products", validateQuery(publicProductQuerySchema), asyncHandler(listPublicProducts));
publicRoutes.get("/products/:id", asyncHandler(getPublicProduct));
