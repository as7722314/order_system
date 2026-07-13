import { Router } from "express";
import {
  createCategory,
  createFlavor,
  createProduct,
  deleteProduct,
  listCategories,
  listFlavors,
  listProducts,
  setProductFlavors,
  updateCategory,
  updateCategoryStatus,
  updateFlavor,
  updateFlavorStatus,
  updateProduct,
  updateProductStatus
} from "../controllers/adminCatalogController.js";
import { streamAdminOrderEvents } from "../controllers/adminOrderEventController.js";
import { cancelOrder, createAdminOnsiteOrder, deleteOrder, getAdminOrder, listAdminOrders, restoreOrder, updateOrderStatus } from "../controllers/orderController.js";
import { createExpense, deleteExpense, listExpenses, updateExpense } from "../controllers/expenseController.js";
import { dailyReport, monthlyReport } from "../controllers/reportController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { validateBody, validateQuery } from "../middlewares/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { UserRole } from "../utils/prismaEnums.js";
import {
  categorySchema,
  flavorSchema,
  productFlavorSchema,
  productSchema,
  statusSchema
} from "../validators/catalogValidators.js";
import {
  adminOrderQuerySchema,
  adminOnsiteOrderSchema,
  cancelOrderSchema,
  deleteOrderSchema,
  updateOrderStatusSchema
} from "../validators/orderValidators.js";
import {
  dailyReportQuerySchema,
  expenseQuerySchema,
  expenseSchema,
  monthlyReportQuerySchema
} from "../validators/expenseValidators.js";

export const adminRoutes = Router();

adminRoutes.get("/admin/order-events", streamAdminOrderEvents);

adminRoutes.use(requireAuth, requireRole(UserRole.ADMIN));

adminRoutes.get("/admin/categories", asyncHandler(listCategories));
adminRoutes.post("/admin/categories", validateBody(categorySchema), asyncHandler(createCategory));
adminRoutes.put("/admin/categories/:id", validateBody(categorySchema), asyncHandler(updateCategory));
adminRoutes.patch("/admin/categories/:id/status", validateBody(statusSchema), asyncHandler(updateCategoryStatus));

adminRoutes.get("/admin/products", asyncHandler(listProducts));
adminRoutes.post("/admin/products", validateBody(productSchema), asyncHandler(createProduct));
adminRoutes.put("/admin/products/:id", validateBody(productSchema), asyncHandler(updateProduct));
adminRoutes.delete("/admin/products/:id", asyncHandler(deleteProduct));
adminRoutes.patch("/admin/products/:id/status", validateBody(statusSchema), asyncHandler(updateProductStatus));
adminRoutes.put("/admin/products/:id/flavors", validateBody(productFlavorSchema), asyncHandler(setProductFlavors));

adminRoutes.get("/admin/flavors", asyncHandler(listFlavors));
adminRoutes.post("/admin/flavors", validateBody(flavorSchema), asyncHandler(createFlavor));
adminRoutes.put("/admin/flavors/:id", validateBody(flavorSchema), asyncHandler(updateFlavor));
adminRoutes.patch("/admin/flavors/:id/status", validateBody(statusSchema), asyncHandler(updateFlavorStatus));

adminRoutes.get("/admin/orders", validateQuery(adminOrderQuerySchema), asyncHandler(listAdminOrders));
adminRoutes.post("/admin/orders/onsite", validateBody(adminOnsiteOrderSchema), asyncHandler(createAdminOnsiteOrder));
adminRoutes.get("/admin/orders/:id", asyncHandler(getAdminOrder));
adminRoutes.patch("/admin/orders/:id/status", validateBody(updateOrderStatusSchema), asyncHandler(updateOrderStatus));
adminRoutes.post("/admin/orders/:id/cancel", validateBody(cancelOrderSchema), asyncHandler(cancelOrder));
adminRoutes.delete("/admin/orders/:id", validateBody(deleteOrderSchema), asyncHandler(deleteOrder));
adminRoutes.post("/admin/orders/:id/restore", asyncHandler(restoreOrder));

adminRoutes.get("/admin/expenses", validateQuery(expenseQuerySchema), asyncHandler(listExpenses));
adminRoutes.post("/admin/expenses", validateBody(expenseSchema), asyncHandler(createExpense));
adminRoutes.put("/admin/expenses/:id", validateBody(expenseSchema), asyncHandler(updateExpense));
adminRoutes.delete("/admin/expenses/:id", asyncHandler(deleteExpense));

adminRoutes.get("/admin/reports/daily", validateQuery(dailyReportQuerySchema), asyncHandler(dailyReport));
adminRoutes.get("/admin/reports/monthly", validateQuery(monthlyReportQuerySchema), asyncHandler(monthlyReport));
