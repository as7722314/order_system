<template>
  <main class="customer-shell">
    <section class="surface-panel">
      <h1 class="hero-title">訂單查詢</h1>
      <div class="mt-5 space-y-4">
        <input v-model.trim="orderNumber" class="field-input" placeholder="訂單編號" />
        <input v-model.trim="phoneLast3" class="field-input" inputmode="numeric" placeholder="手機末三碼" maxlength="3" />
        <button class="primary-action" :disabled="loading" @click="submit">
          {{ loading ? "查詢中..." : "查詢" }}
        </button>
      </div>
      <p v-if="error" class="mt-4 text-[26px] font-black leading-snug text-red-700">{{ error }}</p>
    </section>

    <article v-if="result" class="food-card mt-4 p-4">
      <div class="space-y-3">
        <div>
          <div class="text-[22px] font-bold leading-tight text-stone-600">{{ formatDate(result.createdAt) }}</div>
          <h2 class="mt-2 break-all text-[30px] font-black leading-tight text-griddle-800">{{ result.orderNumber }}</h2>
          <div class="mt-2 text-[22px] font-bold leading-tight text-stone-600">{{ result.customerName }}</div>
        </div>
        <div class="status-panel grid gap-3">
          <OrderStatusBadge :status="result.status" />
          <div class="price-value">NT$ {{ result.totalAmount }}</div>
        </div>
      </div>
      <div class="mt-4 divide-y divide-amber-100 border-t border-amber-100 pt-2">
        <div v-for="item in result.items" :key="item.id" class="py-4 text-[24px] leading-snug">
          <div class="space-y-2">
            <span class="block break-words font-black">{{ item.productNameSnapshot }} x {{ item.quantity }}</span>
            <span class="block font-black text-brand-700">NT$ {{ item.subtotal }}</span>
          </div>
          <div v-if="item.flavors.length" class="mt-2 font-black text-scallion-700">{{ item.flavors.map((flavor) => flavor.flavorNameSnapshot).join("、") }}</div>
          <div v-if="item.note" class="mt-2 font-bold text-stone-600">{{ item.note }}</div>
        </div>
      </div>
      <p v-if="result.cancelReason" class="mt-3 rounded-lg bg-red-50 p-4 text-[24px] font-bold leading-snug text-red-700">取消原因：{{ result.cancelReason }}</p>
    </article>
  </main>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { lookupOrder } from "../api/client";
import OrderStatusBadge from "../components/OrderStatusBadge.vue";
import type { CustomerOrder } from "../types/order";

const orderNumber = ref("");
const phoneLast3 = ref("");
const result = ref<CustomerOrder | null>(null);
const error = ref("");
const loading = ref(false);

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("zh-TW", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

async function submit(): Promise<void> {
  result.value = null;
  error.value = "";
  if (!orderNumber.value || !/^\d{3}$/.test(phoneLast3.value)) {
    error.value = "請輸入訂單編號與手機末三碼。";
    return;
  }
  loading.value = true;
  try {
    result.value = await lookupOrder({ orderNumber: orderNumber.value, phoneLast3: phoneLast3.value });
  } catch {
    error.value = "查無訂單，請確認訂單編號與手機末三碼。";
  } finally {
    loading.value = false;
  }
}
</script>

