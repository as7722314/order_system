<template>
  <main class="w-full px-2 py-2">
    <section class="rounded-lg border border-brand-100 bg-white/95 p-4">
      <h1 class="text-[46px] font-black leading-tight text-brand-700">訂單查詢</h1>
      <div class="mt-5 space-y-4">
        <input v-model.trim="orderNumber" class="w-full rounded-lg border border-brand-100 p-4 text-[30px] font-bold" placeholder="訂單編號" />
        <input v-model.trim="phoneLast3" class="w-full rounded-lg border border-brand-100 p-4 text-[30px] font-bold" inputmode="numeric" placeholder="手機末三碼" maxlength="3" />
        <button class="w-full rounded-lg bg-scallion-600 py-5 text-[34px] font-black leading-tight text-white" :disabled="loading" @click="submit">
          {{ loading ? "查詢中..." : "查詢" }}
        </button>
      </div>
      <p v-if="error" class="mt-4 text-[26px] font-black leading-snug text-red-700">{{ error }}</p>
    </section>

    <article v-if="result" class="mt-3 rounded-lg border border-brand-100 bg-white/95 p-4">
      <div class="space-y-3">
        <div>
          <div class="text-[26px] font-bold leading-tight text-stone-600">{{ formatDate(result.createdAt) }}</div>
          <h2 class="mt-2 break-all text-[34px] font-black leading-tight text-griddle-800">{{ result.orderNumber }}</h2>
          <div class="mt-2 text-[26px] font-bold leading-tight text-stone-600">{{ result.customerName }}</div>
        </div>
        <div class="flex items-center justify-between gap-2">
          <OrderStatusBadge :status="result.status" />
          <div class="text-[38px] font-black leading-none text-brand-700">NT$ {{ result.totalAmount }}</div>
        </div>
      </div>
      <div class="mt-4 divide-y divide-brand-100 border-t border-brand-100 pt-2">
        <div v-for="item in result.items" :key="item.id" class="py-4 text-[26px] leading-snug">
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

