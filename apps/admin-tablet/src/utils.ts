import type { Order, OrderStatus } from "./types";

export const money = (value: number) => `NT$ ${Number(value || 0).toLocaleString("zh-TW")}`;

export function taipeiDate(date = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export function taipeiMonth(date = new Date()): string {
  return taipeiDate(date).slice(0, 7);
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(new Date(value));
}

export function normalizeStatus(status: Order["status"]): OrderStatus {
  return status.toUpperCase() as OrderStatus;
}

export const statusLabels: Record<OrderStatus, string> = {
  PENDING: "待接單", CONFIRMED: "已確認", PREPARING: "製作中", READY: "可取餐", COMPLETED: "已完成", CANCELLED: "已取消",
};

export function nextStatus(status: Order["status"]): { status: OrderStatus; label: string } | null {
  const current = normalizeStatus(status);
  if (current === "PENDING" || current === "CONFIRMED") return { status: "PREPARING", label: "開始製作" };
  if (current === "PREPARING") return { status: "READY", label: "完成製作" };
  if (current === "READY") return { status: "COMPLETED", label: "完成訂單" };
  return null;
}

export function canCancel(status: Order["status"]): boolean {
  const current = normalizeStatus(status);
  return current !== "COMPLETED" && current !== "CANCELLED";
}

export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
