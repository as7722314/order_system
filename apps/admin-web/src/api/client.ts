import axios from "axios";
import type { ApiResponse, BackfillOrderPayload, Category, Expense, Flavor, Order, OrderStatus, Product, Report } from "../types/admin";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api"
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function login(account: string, password: string): Promise<string> {
  const response = await api.post<ApiResponse<{ accessToken: string }>>("/admin/auth/login", { account, password });
  return response.data.data.accessToken;
}

export async function listCategories(): Promise<Category[]> {
  const response = await api.get<ApiResponse<Category[]>>("/admin/categories");
  return response.data.data;
}

export async function saveCategory(payload: Partial<Category>): Promise<void> {
  if (payload.id) await api.put(`/admin/categories/${payload.id}`, payload);
  else await api.post("/admin/categories", payload);
}

export async function listProducts(): Promise<Product[]> {
  const response = await api.get<ApiResponse<Product[]>>("/admin/products");
  return response.data.data;
}

export async function saveProduct(payload: Partial<Product> & { flavorIds?: string[] }): Promise<void> {
  const body = {
    name: payload.name ?? "",
    description: payload.description ?? "",
    price: Number(payload.price ?? 0),
    sortOrder: Number(payload.sortOrder ?? 0),
    isActive: payload.isActive ?? true,
    flavorIds: payload.flavorIds ?? []
  };
  if (payload.id) await api.put(`/admin/products/${payload.id}`, body);
  else await api.post("/admin/products", body);
}

export async function deleteProduct(id: string): Promise<void> {
  await api.delete(`/admin/products/${id}`);
}

export async function listFlavors(): Promise<Flavor[]> {
  const response = await api.get<ApiResponse<Flavor[]>>("/admin/flavors");
  return response.data.data;
}

export async function saveFlavor(payload: Partial<Flavor>): Promise<void> {
  if (payload.id) await api.put(`/admin/flavors/${payload.id}`, payload);
  else await api.post("/admin/flavors", payload);
}

export type OrderListParams = {
  status?: OrderStatus;
  date?: string;
  keyword?: string;
  deleted?: "active" | "deleted" | "all";
  page?: number;
  pageSize?: number;
};

export async function listOrders(params: OrderListParams = {}): Promise<Order[]> {
  const response = await api.get<ApiResponse<{ items: Order[] }>>("/admin/orders", { params });
  return response.data.data.items;
}

export async function createBackfillOrder(payload: BackfillOrderPayload): Promise<Order> {
  const response = await api.post<ApiResponse<Order>>("/admin/orders/backfill", payload);
  return response.data.data;
}

export async function updateOrderStatus(id: string, status: string): Promise<void> {
  await api.patch(`/admin/orders/${id}/status`, { status });
}

export async function cancelOrder(id: string, reason: string): Promise<void> {
  await api.post(`/admin/orders/${id}/cancel`, { reason });
}

export async function deleteOrder(id: string, reason?: string): Promise<void> {
  await api.delete(`/admin/orders/${id}`, { data: { reason } });
}

export async function restoreOrder(id: string): Promise<void> {
  await api.post(`/admin/orders/${id}/restore`);
}

export async function listExpenses(): Promise<Expense[]> {
  const response = await api.get<ApiResponse<{ items: Expense[] }>>("/admin/expenses");
  return response.data.data.items;
}

export async function saveExpense(payload: Partial<Expense>): Promise<void> {
  if (payload.id) await api.put(`/admin/expenses/${payload.id}`, payload);
  else await api.post("/admin/expenses", payload);
}

export async function deleteExpense(id: string): Promise<void> {
  await api.delete(`/admin/expenses/${id}`);
}

export async function dailyReport(date: string): Promise<Report> {
  const response = await api.get<ApiResponse<Report>>("/admin/reports/daily", { params: { date } });
  return response.data.data;
}

export async function monthlyReport(month: string): Promise<Report & { month: string; daily: { date: string; revenue: number; expense: number; netProfit: number }[] }> {
  const response = await api.get<ApiResponse<Report & { month: string; daily: { date: string; revenue: number; expense: number; netProfit: number }[] }>>("/admin/reports/monthly", { params: { month } });
  return response.data.data;
}
