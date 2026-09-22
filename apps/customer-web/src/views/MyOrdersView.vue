<template>
  <main class="customer-shell">
    <div class="page-heading">
      <div>
        <span class="menu-eyebrow">MY ORDERS</span>
        <h1>我的訂單</h1>
      </div>
      <button class="refresh-button" :disabled="loading" @click="load">重新整理</button>
    </div>

    <div v-if="loading" class="surface-panel empty-state"><p>載入中...</p></div>
    <div v-else-if="error" class="surface-panel form-error">{{ error }}</div>
    <div v-else-if="orders.length === 0" class="surface-panel empty-state">
      <span>🧾</span>
      <h2>目前沒有歷史訂單</h2>
      <p>送出訂單後，可以在這裡查看進度。</p>
    </div>

    <section v-else class="order-list">
      <article v-for="order in orders" :key="order.orderNumber" class="food-card order-card">
        <div class="order-card-head">
          <div>
            <small>{{ formatDate(order.createdAt) }}</small>
            <h2>{{ order.orderNumber }}</h2>
          </div>
          <OrderStatusBadge :status="order.status" />
        </div>
        <div class="order-items">
          <div v-for="item in order.items" :key="item.id" class="order-item-row">
            <div>
              <strong>{{ item.productNameSnapshot }} × {{ item.quantity }}</strong>
              <span v-if="item.flavors.length">{{ item.flavors.map((flavor) => flavor.flavorNameSnapshot).join("、") }}</span>
              <span v-if="item.note">{{ item.note }}</span>
            </div>
            <b>NT$ {{ item.subtotal }}</b>
          </div>
        </div>
        <div class="order-card-total"><span>訂單合計</span><strong>NT$ {{ order.totalAmount }}</strong></div>
        <p v-if="order.cancelReason" class="cancel-reason">取消原因：{{ order.cancelReason }}</p>
      </article>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { listMyOrders } from "../api/client";
import OrderStatusBadge from "../components/OrderStatusBadge.vue";
import { DEV_BYPASS_AUTH } from "../config/environment";
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
    error.value = DEV_BYPASS_AUTH
      ? "目前是介面預覽模式，使用 LINE 登入後即可查看歷史訂單。"
      : "讀取歷史訂單失敗，請重新登入 LINE 後再試一次。";
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>
