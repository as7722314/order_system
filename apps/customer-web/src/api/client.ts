import axios from "axios";
import type { ApiResponse, Category, CustomerOrder, OrderSummary, Product } from "../types/order";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api"
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("customer_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function fetchCategories(): Promise<Category[]> {
  const response = await api.get<ApiResponse<Category[]>>("/categories");
  return response.data.data;
}

export async function fetchProducts(categoryId?: string): Promise<Product[]> {
  const response = await api.get<ApiResponse<Product[]>>("/products", { params: { categoryId } });
  return response.data.data;
}

export async function createOrder(payload: {
  customerPhone: string;
  note?: string;
  items: { productId: string; quantity: number; flavorIds: string[]; note?: string }[];
}): Promise<OrderSummary> {
  const response = await api.post<ApiResponse<OrderSummary>>("/orders", payload);
  return response.data.data;
}

export async function listMyOrders(): Promise<CustomerOrder[]> {
  const response = await api.get<ApiResponse<CustomerOrder[]>>("/orders/my");
  return response.data.data;
}

export async function lookupOrder(payload: { orderNumber: string; phoneLast3: string }): Promise<CustomerOrder> {
  const response = await api.post<ApiResponse<CustomerOrder>>("/orders/lookup", payload);
  return response.data.data;
}
