import type { Order, OrderStatus } from "../types/admin";

export type StatusAction = {
  status: OrderStatus;
  label: string;
  className: string;
};

const actionMap: Record<OrderStatus, StatusAction[]> = {
  PENDING: [{ status: "PREPARING", label: "開始製作", className: "bg-amber-500 text-white hover:bg-amber-600" }],
  CONFIRMED: [{ status: "PREPARING", label: "開始製作", className: "bg-amber-500 text-white hover:bg-amber-600" }],
  PREPARING: [{ status: "READY", label: "完成製作", className: "bg-sky-600 text-white hover:bg-sky-700" }],
  READY: [{ status: "COMPLETED", label: "完成訂單", className: "bg-emerald-600 text-white hover:bg-emerald-700" }],
  COMPLETED: [],
  CANCELLED: []
};

export function normalizeStatus(status: Order["status"]): OrderStatus {
  return status.toUpperCase() as OrderStatus;
}

export function statusActions(status: Order["status"]): StatusAction[] {
  return actionMap[normalizeStatus(status)] ?? [];
}

export function canCancel(status: Order["status"]): boolean {
  const normalized = normalizeStatus(status);
  return normalized !== "COMPLETED" && normalized !== "CANCELLED";
}
