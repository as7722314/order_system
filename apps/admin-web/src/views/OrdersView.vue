<template>
  <main class="p-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold">訂單</h1>
        <p class="mt-1 text-sm text-stone-500">刪除後會移到已刪除區，可再復原。</p>
      </div>
      <button class="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm" :disabled="loading" @click="load">重新整理</button>
    </div>

    <div class="mt-5 inline-flex rounded-lg border border-stone-200 bg-white p-1 text-sm font-medium">
      <button
        class="rounded-md px-4 py-2"
        :class="viewMode === 'active' ? 'bg-accent text-white' : 'text-stone-600 hover:bg-stone-100'"
        type="button"
        @click="selectView('active')"
      >
        一般訂單
      </button>
      <button
        class="rounded-md px-4 py-2"
        :class="viewMode === 'deleted' ? 'bg-accent text-white' : 'text-stone-600 hover:bg-stone-100'"
        type="button"
        @click="selectView('deleted')"
      >
        已刪除
      </button>
    </div>

    <div class="mt-5 overflow-x-auto rounded-lg bg-white">
      <table class="w-full text-left text-sm">
        <thead class="bg-stone-100 text-stone-600">
          <tr>
            <th class="p-3">訂單編號</th>
            <th class="p-3">建立時間</th>
            <th v-if="viewMode === 'deleted'" class="p-3">刪除時間</th>
            <th class="p-3">客戶</th>
            <th class="p-3">手機後三碼</th>
            <th class="p-3">狀態</th>
            <th class="p-3">金額</th>
            <th v-if="viewMode === 'deleted'" class="p-3">刪除原因</th>
            <th class="p-3 text-right">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in orders" :key="order.id" class="border-b border-stone-100">
            <td class="p-3 font-medium">{{ order.orderNumber }}</td>
            <td class="p-3 whitespace-nowrap text-stone-600">{{ formatDateTime(order.createdAt) }}</td>
            <td v-if="viewMode === 'deleted'" class="p-3 whitespace-nowrap text-stone-600">{{ order.deletedAt ? formatDateTime(order.deletedAt) : '-' }}</td>
            <td class="p-3">{{ order.customerName }}</td>
            <td class="p-3 font-medium text-stone-700">{{ phoneLast3(order.customerPhone) }}</td>
            <td class="p-3"><StatusBadge :status="order.status" /></td>
            <td class="p-3">NT$ {{ order.totalAmount }}</td>
            <td v-if="viewMode === 'deleted'" class="p-3 max-w-xs text-stone-600">{{ order.deletedReason || '未填寫' }}</td>
            <td class="p-3 text-right">
              <div class="flex flex-wrap justify-end gap-2">
                <template v-if="viewMode === 'active'">
                  <button
                    v-for="action in statusActions(order.status)"
                    :key="action.status"
                    class="rounded-md px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
                    :class="action.className"
                    :disabled="loading"
                    @click="changeStatus(order.id, action.status)"
                  >
                    {{ action.label }}
                  </button>
                  <button
                    v-if="canCancel(order.status)"
                    class="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    :disabled="loading"
                    @click="cancel(order)"
                  >
                    取消
                  </button>
                  <button
                    class="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                    :disabled="loading"
                    @click="softDelete(order)"
                  >
                    刪除
                  </button>
                </template>
                <template v-else>
                  <button
                    class="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    :disabled="loading"
                    @click="restore(order)"
                  >
                    復原
                  </button>
                </template>
              </div>
            </td>
          </tr>
          <tr v-if="orders.length === 0">
            <td :colspan="viewMode === 'deleted' ? 9 : 7" class="p-6 text-center text-stone-500">
              {{ viewMode === 'deleted' ? '目前沒有已刪除訂單' : '目前沒有訂單' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="error" class="mt-3 text-sm text-red-600">{{ error }}</p>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { cancelOrder, deleteOrder, listOrders, restoreOrder, updateOrderStatus } from "../api/client";
import StatusBadge from "../components/StatusBadge.vue";
import type { Order, OrderStatus } from "../types/admin";
import { canCancel, statusActions } from "../utils/orderStatusActions";
import { phoneLast3 } from "../utils/phone";

type OrderViewMode = "active" | "deleted";

const orders = ref<Order[]>([]);
const viewMode = ref<OrderViewMode>("active");
const loading = ref(false);
const error = ref("");

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(value));
}

async function selectView(mode: OrderViewMode): Promise<void> {
  if (viewMode.value === mode) return;
  viewMode.value = mode;
  await load();
}

async function load(): Promise<void> {
  loading.value = true;
  error.value = "";
  try {
    orders.value = await listOrders({ deleted: viewMode.value, pageSize: 100 });
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

async function softDelete(order: Order): Promise<void> {
  const firstConfirmed = window.confirm(`確定要刪除訂單「${order.orderNumber}」？刪除後會先移到已刪除區。`);
  if (!firstConfirmed) return;
  const reason = window.prompt("請輸入刪除原因，可留空。按取消會中止刪除。", "");
  if (reason === null) return;
  const secondConfirmed = window.confirm(`最後確認：要刪除訂單「${order.orderNumber}」嗎？`);
  if (!secondConfirmed) return;
  loading.value = true;
  error.value = "";
  try {
    await deleteOrder(order.id, reason.trim() || undefined);
    await load();
  } catch {
    error.value = "刪除訂單失敗";
    loading.value = false;
  }
}

async function restore(order: Order): Promise<void> {
  const confirmed = window.confirm(`確定要復原訂單「${order.orderNumber}」？`);
  if (!confirmed) return;
  loading.value = true;
  error.value = "";
  try {
    await restoreOrder(order.id);
    await load();
  } catch {
    error.value = "復原訂單失敗";
    loading.value = false;
  }
}

onMounted(load);
</script>
