<template>
  <main class="p-6">
    <p class="admin-eyebrow">營業紀錄</p><h1 class="text-2xl font-semibold">報表</h1>
    <p class="mt-2 text-sm text-stone-500">營業額依已完成訂單統計；成本為成本管理中登錄的金額合計。</p>
    <p v-if="error" role="alert" class="admin-form-error mt-4">{{ error }}</p>
    <section class="mt-5 grid gap-4 md:grid-cols-2">
      <div class="rounded-lg border border-stone-200 bg-white p-5">
        <div class="flex gap-2">
          <input v-model="date" aria-label="日結日期" class="rounded-md border border-stone-300 p-3" type="date" />
          <button class="rounded-md bg-accent px-4 py-3 text-white disabled:opacity-50" :disabled="dailyLoading" :aria-busy="dailyLoading" @click="loadDaily">{{ dailyLoading ? "讀取中…" : "日結" }}</button>
        </div>
        <table v-if="daily" class="mt-4 w-full text-left text-sm">
          <tbody>
            <tr class="border-b border-stone-100"><th class="p-3 text-stone-500">日期</th><td class="p-3">{{ daily.date }}</td></tr>
            <tr class="border-b border-stone-100"><th class="p-3 text-stone-500">完成訂單數</th><td class="p-3">{{ daily.orderCount }}</td></tr>
            <tr class="border-b border-stone-100"><th class="p-3 text-stone-500">營業額</th><td class="p-3">NT$ {{ daily.totalRevenue }}</td></tr>
            <tr class="border-b border-stone-100"><th class="p-3 text-stone-500">成本</th><td class="p-3">NT$ {{ daily.totalExpense }}</td></tr>
          </tbody>
        </table>
      </div>
      <div class="rounded-lg border border-stone-200 bg-white p-5">
        <div class="flex gap-2">
          <input v-model="month" aria-label="月結月份" class="rounded-md border border-stone-300 p-3" type="month" />
          <button class="rounded-md bg-accent px-4 py-3 text-white disabled:opacity-50" :disabled="monthlyLoading" :aria-busy="monthlyLoading" @click="loadMonthly">{{ monthlyLoading ? "讀取中…" : "月結" }}</button>
        </div>
        <table v-if="monthly" class="mt-4 w-full text-left text-sm">
          <tbody>
            <tr class="border-b border-stone-100"><th class="p-3 text-stone-500">月份</th><td class="p-3">{{ monthly.month }}</td></tr>
            <tr class="border-b border-stone-100"><th class="p-3 text-stone-500">完成訂單數</th><td class="p-3">{{ monthly.orderCount }}</td></tr>
            <tr class="border-b border-stone-100"><th class="p-3 text-stone-500">營業額</th><td class="p-3">NT$ {{ monthly.totalRevenue }}</td></tr>
            <tr class="border-b border-stone-100"><th class="p-3 text-stone-500">成本</th><td class="p-3">NT$ {{ monthly.totalExpense }}</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <section v-if="monthly?.daily.length" class="mt-5 rounded-lg border border-stone-200 bg-white p-5">
      <h2 class="text-lg font-semibold">月結每日明細</h2>
      <div class="admin-table-wrap mt-4"><table class="w-full text-left text-sm">
        <thead class="bg-stone-100 text-stone-600">
          <tr>
            <th class="p-3">日期</th>
            <th class="p-3">營業額</th>
            <th class="p-3">成本</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in monthly.daily" :key="row.date" class="border-b border-stone-100">
            <td class="p-3">{{ row.date }}</td>
            <td class="p-3">NT$ {{ row.revenue }}</td>
            <td class="p-3">NT$ {{ row.expense }}</td>
          </tr>
        </tbody>
      </table></div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { dailyReport, monthlyReport } from "../api/client";
import type { Report } from "../types/admin";
import { useAdminFeedback } from "../composables/useAdminFeedback";

type DailyReport = Report & { date: string };
type MonthlyReport = Report & { month: string; daily: { date: string; revenue: number; expense: number }[] };

const date = ref(new Date().toISOString().slice(0, 10));
const month = ref(new Date().toISOString().slice(0, 7));
const daily = ref<DailyReport | null>(null);
const monthly = ref<MonthlyReport | null>(null);
const dailyLoading = ref(false);
const monthlyLoading = ref(false);
const error = ref("");
const feedback = useAdminFeedback();

async function loadDaily(): Promise<void> {
  if (dailyLoading.value) return;
  dailyLoading.value = true;
  daily.value = null;
  error.value = "";
  try {
    daily.value = await dailyReport(date.value) as DailyReport;
    feedback.success("日結報表已更新");
  } catch {
    error.value = "讀取日結報表失敗，請稍後再試。";
    feedback.error(error.value);
  } finally { dailyLoading.value = false; }
}

async function loadMonthly(): Promise<void> {
  if (monthlyLoading.value) return;
  monthlyLoading.value = true;
  monthly.value = null;
  error.value = "";
  try {
    monthly.value = await monthlyReport(month.value);
    feedback.success("月結報表已更新");
  } catch {
    error.value = "讀取月結報表失敗，請稍後再試。";
    feedback.error(error.value);
  } finally { monthlyLoading.value = false; }
}
</script>
