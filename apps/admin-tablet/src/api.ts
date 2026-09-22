import type { ApiResponse, Category, DailyReport, Expense, Flavor, MonthlyReport, OnsiteOrderPayload, Order, OrderStatus, Product, StoreStatus } from "./types";

const configuredUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
export const API_BASE_URL = (configuredUrl || "http://localhost:3000/api").replace(/\/$/, "");

let accessToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function configureApi(token: string | null, onUnauthorized?: () => void): void {
  accessToken = token;
  if (onUnauthorized) unauthorizedHandler = onUnauthorized;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body) headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  } catch {
    throw new Error(`無法連線到後端：${API_BASE_URL}`);
  }
  if (response.status === 401) unauthorizedHandler?.();
  const payload = await response.json().catch(() => null) as ApiResponse<T> | { message?: string; error?: { message?: string } } | null;
  const serverMessage = payload?.message || (payload && "error" in payload ? payload.error?.message : undefined);
  if (!response.ok) throw new Error(serverMessage || `伺服器錯誤 (${response.status})`);
  return (payload as ApiResponse<T>).data;
}

const query = (params: Record<string, string | number | undefined>) => {
  const values = Object.entries(params).filter(([, value]) => value !== undefined && value !== "");
  return values.length ? `?${values.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`).join("&")}` : "";
};
const json = (value: unknown) => JSON.stringify(value);

export const adminApi = {
  login: (account: string, password: string) => request<{ accessToken: string }>("/admin/auth/login", { method: "POST", body: json({ account, password }) }),
  getStoreStatus: () => request<StoreStatus>("/admin/store/status"),
  updateStoreStatus: (isOpen: boolean) => request<StoreStatus>("/admin/store/status", { method: "PATCH", body: json({ isOpen }) }),
  registerPushToken: (token: string, platform: string) => request<void>("/admin/push-tokens", { method: "POST", body: json({ token, platform }) }),
  unregisterPushToken: (token: string, platform: string) => request<void>("/admin/push-tokens", { method: "DELETE", body: json({ token, platform }) }),
  listCategories: () => request<Category[]>("/admin/categories"),
  saveCategory: (value: Partial<Category>) => request<void>(value.id ? `/admin/categories/${value.id}` : "/admin/categories", { method: value.id ? "PUT" : "POST", body: json(value) }),
  listFlavors: () => request<Flavor[]>("/admin/flavors"),
  saveFlavor: (value: Partial<Flavor>) => request<void>(value.id ? `/admin/flavors/${value.id}` : "/admin/flavors", { method: value.id ? "PUT" : "POST", body: json(value) }),
  listProducts: () => request<Product[]>("/admin/products"),
  saveProduct: (value: Partial<Product> & { flavorIds: string[] }) => {
    const body = { name: value.name || "", description: value.description || "", price: Number(value.price || 0), sortOrder: Number(value.sortOrder || 0), isActive: value.isActive ?? true, flavorIds: value.flavorIds };
    return request<void>(value.id ? `/admin/products/${value.id}` : "/admin/products", { method: value.id ? "PUT" : "POST", body: json(body) });
  },
  deleteProduct: (id: string) => request<void>(`/admin/products/${id}`, { method: "DELETE" }),
  listOrders: (params: { status?: OrderStatus; date?: string; keyword?: string; deleted?: "active" | "deleted" | "all"; pageSize?: number } = {}) => request<{ items: Order[] }>(`/admin/orders${query(params)}`).then((data) => data.items),
  createOnsiteOrder: (value: OnsiteOrderPayload) => request<Order>("/admin/orders/onsite", { method: "POST", body: json(value) }),
  updateOrderStatus: (id: string, status: OrderStatus) => request<void>(`/admin/orders/${id}/status`, { method: "PATCH", body: json({ status }) }),
  cancelOrder: (id: string, reason: string) => request<void>(`/admin/orders/${id}/cancel`, { method: "POST", body: json({ reason }) }),
  deleteOrder: (id: string, reason?: string) => request<void>(`/admin/orders/${id}`, { method: "DELETE", body: json({ reason }) }),
  restoreOrder: (id: string) => request<void>(`/admin/orders/${id}/restore`, { method: "POST" }),
  listExpenses: (params: { startDate?: string; endDate?: string; category?: string; pageSize?: number } = {}) => request<{ items: Expense[] }>(`/admin/expenses${query(params)}`).then((data) => data.items),
  saveExpense: (value: Partial<Expense>) => {
    const body = { expenseDate: value.expenseDate, category: value.category || "日常消耗", name: value.name || "", amount: Number(value.amount || 0), note: value.note || "" };
    return request<void>(value.id ? `/admin/expenses/${value.id}` : "/admin/expenses", { method: value.id ? "PUT" : "POST", body: json(body) });
  },
  deleteExpense: (id: string) => request<void>(`/admin/expenses/${id}`, { method: "DELETE" }),
  dailyReport: (date: string) => request<DailyReport>(`/admin/reports/daily${query({ date })}`),
  monthlyReport: (month: string) => request<MonthlyReport>(`/admin/reports/monthly${query({ month })}`),
};
