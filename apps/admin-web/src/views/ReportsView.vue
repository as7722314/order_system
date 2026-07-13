<template>
  <main class="p-6">
    <h1 class="text-2xl font-semibold">報表</h1>
    <section class="mt-5 grid gap-4 md:grid-cols-2">
      <div class="rounded-lg border border-stone-200 bg-white p-5">
        <div class="flex gap-2">
          <input v-model="date" class="rounded-md border border-stone-300 p-3" type="date" />
          <button class="rounded-md bg-accent px-4 py-3 text-white" @click="loadDaily">日結</button>
        </div>
        <table v-if="daily" class="mt-4 w-full text-left text-sm">
          <tbody>
            <tr class="border-b border-stone-100"><th class="p-3 text-stone-500">日期</th><td class="p-3">{{ daily.date }}</td></tr>
            <tr class="border-b border-stone-100"><th class="p-3 text-stone-500">完成訂單數</th><td class="p-3">{{ daily.orderCount }}</td></tr>
            <tr class="border-b border-stone-100"><th class="p-3 text-stone-500">營業額</th><td class="p-3">NT$ {{ daily.totalRevenue }}</td></tr>
            <tr class="border-b border-stone-100"><th class="p-3 text-stone-500">成本</th><td class="p-3">NT$ {{ daily.totalExpense }}</td></tr>
            <tr><th class="p-3 text-stone-500">淨利</th><td class="p-3 font-semibold">NT$ {{ daily.netProfit }}</td></tr>
          </tbody>
        </table>
      </div>
      <div class="rounded-lg border border-stone-200 bg-white p-5">
        <div class="flex gap-2">
          <input v-model="month" class="rounded-md border border-stone-300 p-3" type="month" />
          <button class="rounded-md bg-accent px-4 py-3 text-white" @click="loadMonthly">月結</button>
        </div>
        <table v-if="monthly" class="mt-4 w-full text-left text-sm">
          <tbody>
            <tr class="border-b border-stone-100"><th class="p-3 text-stone-500">月份</th><td class="p-3">{{ monthly.month }}</td></tr>
            <tr class="border-b border-stone-100"><th class="p-3 text-stone-500">完成訂單數</th><td class="p-3">{{ monthly.orderCount }}</td></tr>
            <tr class="border-b border-stone-100"><th class="p-3 text-stone-500">營業額</th><td class="p-3">NT$ {{ monthly.totalRevenue }}</td></tr>
            <tr class="border-b border-stone-100"><th class="p-3 text-stone-500">成本</th><td class="p-3">NT$ {{ monthly.totalExpense }}</td></tr>
            <tr><th class="p-3 text-stone-500">淨利</th><td class="p-3 font-semibold">NT$ {{ monthly.netProfit }}</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <section v-if="monthly?.daily.length" class="mt-5 rounded-lg border border-stone-200 bg-white p-5">
      <h2 class="text-lg font-semibold">月結每日明細</h2>
      <table class="mt-4 w-full text-left text-sm">
        <thead class="bg-stone-100 text-stone-600">
          <tr>
            <th class="p-3">日期</th>
            <th class="p-3">營業額</th>
            <th class="p-3">成本</th>
            <th class="p-3">淨利</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in monthly.daily" :key="row.date" class="border-b border-stone-100">
            <td class="p-3">{{ row.date }}</td>
            <td class="p-3">NT$ {{ row.revenue }}</td>
            <td class="p-3">NT$ {{ row.expense }}</td>
            <td class="p-3">NT$ {{ row.netProfit }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { dailyReport, monthlyReport } from "../api/client";
import type { Report } from "../types/admin";

type DailyReport = Report & { date: string };
type MonthlyReport = Report & { month: string; daily: { date: string; revenue: number; expense: number; netProfit: number }[] };

const date = ref(new Date().toISOString().slice(0, 10));
const month = ref(new Date().toISOString().slice(0, 7));
const daily = ref<DailyReport | null>(null);
const monthly = ref<MonthlyReport | null>(null);

async function loadDaily(): Promise<void> {
  daily.value = await dailyReport(date.value) as DailyReport;
}

async function loadMonthly(): Promise<void> {
  monthly.value = await monthlyReport(month.value);
}
</script>
