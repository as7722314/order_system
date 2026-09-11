<template>
  <main class="customer-shell">
    <div class="hero-panel mb-4 p-4">
      <h1 class="hero-title">我的訂單</h1>
      <button class="secondary-action mt-4" :disabled="loading" @click="load">重新整理</button>
    </div>

    <div v-if="loading" class="surface-panel text-[30px] font-black leading-snug text-stone-700">載入中...</div>
    <div v-else-if="error" class="rounded-lg border-4 border-red-200 bg-red-50 p-5 text-[28px] font-black leading-snug text-red-700">{{ error }}</div>
    <div v-else-if="orders.length === 0" class="surface-panel text-[30px] font-black leading-snug text-stone-700">目前沒有歷史訂單。</div>

    <section v-else class="space-y-4">
      <article v-for="order in orders" :key="order.orderNumber" class="food-card">
        <div class="hero-strip">{{ formatDate(order.createdAt) }}</div>
        <div class="space-y-4 p-4">
          <div>
            <h2 class="break-all text-[32px] font-black leading-tight text-griddle-800">{{ order.orderNumber }}</h2>
          </div>
          <div class="status-panel grid grid-cols-1 gap-3">
            <OrderStatusBadge :status="order.status" />
            <div class="price-value">NT$ {{ order.totalAmount }}</div>
          </div>
        </div>
        <div class="divide-y-2 divide-amber-100 border-t-2 border-amber-100 bg-white/80 px-4">
          <div v-for="item in order.items" :key="item.id" class="py-5 leading-snug">
            <span class="block break-words text-[30px] font-black leading-tight text-griddle-800">{{ item.productNameSnapshot }} x {{ item.quantity }}</span>
            <span class="mt-2 block text-[28px] font-black leading-tight text-brand-700">NT$ {{ item.subtotal }}</span>
            <div v-if="item.flavors.length" class="mt-3 rounded-lg bg-[#eef8dc] p-3 text-[25px] font-black leading-snug text-scallion-700">{{ item.flavors.map((flavor) => flavor.flavorNameSnapshot).join("、") }}</div>
            <div v-if="item.note" class="mt-3 text-[24px] font-bold leading-snug text-stone-600">{{ item.note }}</div>
          </div>
        </div>
        <p v-if="order.cancelReason" class="m-4 rounded-lg bg-red-50 p-4 text-[24px] font-bold leading-snug text-red-700">取消原因：{{ order.cancelReason }}</p>
      </article>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { listMyOrders } from "../api/client";
import OrderStatusBadge from "../components/OrderStatusBadge.vue";
import type { CustomerOrder } from "../types/order";

const orders = ref<CustomerOrder[]>([]);
const loading = ref(false);
const error = ref("");

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("zh-TW", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

async function load(): Promise<void> {
  loading.value = true;
  error.value = "";
  try {
    orders.value = await listMyOrders();
  } catch {
    error.value = "讀取歷史訂單失敗，請重新登入 LINE 後再試一次。";
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>
