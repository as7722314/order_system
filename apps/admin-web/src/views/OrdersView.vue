<template>
  <main class="p-6">
    <div class="flex items-center justify-between gap-4">
      <h1 class="text-2xl font-semibold">訂單</h1>
      <button class="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm" :disabled="loading" @click="load">重新整理</button>
    </div>

    <table class="mt-5 w-full rounded-lg bg-white text-left text-sm">
      <thead class="bg-stone-100 text-stone-600">
        <tr>
          <th class="p-3">訂單編號</th>
          <th class="p-3">客戶</th>
          <th class="p-3">手機</th>
          <th class="p-3">狀態</th>
          <th class="p-3">金額</th>
          <th class="p-3 text-right">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="order in orders" :key="order.id" class="border-b border-stone-100">
          <td class="p-3 font-medium">{{ order.orderNumber }}</td>
          <td class="p-3">{{ order.customerName }}</td>
          <td class="p-3">{{ order.customerPhone }}</td>
          <td class="p-3"><StatusBadge :status="order.status" /></td>
          <td class="p-3">NT$ {{ order.totalAmount }}</td>
          <td class="p-3 text-right">
            <div class="flex flex-wrap justify-end gap-2">
              <button
                v-for="action in statusActions(order.status)"
                :key="action.status"
                class="rounded-md px-3 py-2 text-sm font-medium"
                :class="action.className"
                :disabled="loading"
                @click="changeStatus(order.id, action.status)"
              >
                {{ action.label }}
              </button>
              <button
                v-if="canCancel(order.status)"
                class="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white"
                :disabled="loading"
                @click="cancel(order)"
              >
                取消
              </button>
              <span v-if="statusActions(order.status).length === 0 && !canCancel(order.status)" class="px-2 py-2 text-xs text-stone-500">無可用操作</span>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-if="error" class="mt-3 text-sm text-red-600">{{ error }}</p>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { cancelOrder, listOrders, updateOrderStatus } from "../api/client";
import StatusBadge from "../components/StatusBadge.vue";
import type { Order, OrderStatus } from "../types/admin";

const orders = ref<Order[]>([]);
const loading = ref(false);
const error = ref("");

type StatusAction = { status: OrderStatus; label: string; className: string };

const actionMap: Record<OrderStatus, StatusAction[]> = {
  PENDING: [{ status: "PREPARING", label: "開始製作", className: "bg-amber-500 text-white" }],
  CONFIRMED: [{ status: "PREPARING", label: "開始製作", className: "bg-amber-500 text-white" }],
  PREPARING: [{ status: "READY", label: "完成製作", className: "bg-sky-600 text-white" }],
  READY: [{ status: "COMPLETED", label: "完成訂單", className: "bg-emerald-600 text-white" }],
  COMPLETED: [],
  CANCELLED: []
};

function normalizeStatus(status: Order["status"]): OrderStatus {
  return status.toUpperCase() as OrderStatus;
}

function statusActions(status: Order["status"]): StatusAction[] {
  return actionMap[normalizeStatus(status)] ?? [];
}

function canCancel(status: Order["status"]): boolean {
  const normalized = normalizeStatus(status);
  return normalized !== "COMPLETED" && normalized !== "CANCELLED";
}

async function load(): Promise<void> {
  loading.value = true;
  error.value = "";
  try {
    orders.value = await listOrders();
  } catch {
    error.value = "讀取訂單失敗";
  } finally {
    loading.value = false;
  }
}

async function changeStatus(id: string, status: OrderStatus): Promise<void> {
  loading.value = true;
  error.value = "";
  try {
    await updateOrderStatus(id, status);
    await load();
  } catch {
    error.value = "更新訂單狀態失敗";
    loading.value = false;
  }
}

async function cancel(order: Order): Promise<void> {
  const confirmed = window.confirm(`確定要取消訂單「${order.orderNumber}」？`);
  if (!confirmed) return;
  loading.value = true;
  error.value = "";
  try {
    await cancelOrder(order.id, "管理者取消");
    await load();
  } catch {
    error.value = "取消訂單失敗";
    loading.value = false;
  }
}

onMounted(load);
</script>

