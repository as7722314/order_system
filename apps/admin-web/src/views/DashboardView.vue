<template>
  <main class="p-6">
    <h1 class="text-2xl font-semibold">儀表板</h1>
    <div class="mt-5 grid gap-4 md:grid-cols-3">
      <section v-for="card in cards" :key="card.label" class="rounded-lg border border-stone-200 bg-white p-5">
        <p class="text-sm text-stone-500">{{ card.label }}</p>
        <p class="mt-2 text-2xl font-semibold">{{ card.value }}</p>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { dailyReport, listOrders } from "../api/client";

const today = new Date().toISOString().slice(0, 10);
const cards = ref([
  { label: "今日訂單數", value: "0" },
  { label: "待接單數", value: "0" },
  { label: "今日淨利", value: "NT$ 0" }
]);

onMounted(async () => {
  const [report, orders] = await Promise.all([dailyReport(today), listOrders()]);
  cards.value = [
    { label: "今日訂單數", value: String(report.orderCount) },
    { label: "待接單數", value: String(orders.filter((order) => order.status === "PENDING").length) },
    { label: "今日淨利", value: `NT$ ${report.netProfit}` }
  ];
});
</script>
