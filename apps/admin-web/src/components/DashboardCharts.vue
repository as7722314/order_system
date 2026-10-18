<template>
  <section class="mt-8" aria-label="營運圖表">
    <div class="admin-section-heading"><h2><AdminIcon name="revenue" />營運趨勢</h2><span class="text-xs text-stone-500">營業額依完成時間統計</span></div>
    <div v-if="overviewError" class="admin-chart-error" role="alert">{{ overviewError }}<button type="button" @click="loadOverview">重新載入</button></div>
    <div class="admin-charts-grid">
      <article class="admin-chart-card" :aria-busy="overviewLoading">
        <header class="admin-chart-heading"><div><h3>營業額趨勢</h3><p>了解最近的營業表現</p></div><div class="admin-segment-control" aria-label="營業額日期區間"><button v-for="days in [7, 30]" :key="days" type="button" :aria-pressed="trendDays === days" @click="trendDays = days">近 {{ days }} 天</button></div></header>
        <template v-if="overview && !overviewLoading">
          <div class="admin-chart-summary"><strong>{{ money(trendTotal) }}</strong><span>{{ trendPoints[0]?.date }} — {{ trendPoints.at(-1)?.date }}</span></div>
          <AdminChart type="line" :data="trendData" :options="amountOptions" label="近幾日營業額趨勢折線圖" />
          <p v-if="trendTotal === 0" class="admin-chart-note">此區間尚無已完成訂單。</p>
          <details class="admin-chart-data"><summary>查看每日數據</summary><div class="admin-table-wrap mt-3"><table class="w-full text-left text-sm"><thead><tr><th>日期</th><th>營業額</th></tr></thead><tbody><tr v-for="row in trendPoints" :key="row.date"><td>{{ row.date }}</td><td>{{ money(row.revenue) }}</td></tr></tbody></table></div></details>
        </template>
        <div v-else class="admin-chart-placeholder" role="status">{{ overviewLoading ? "正在整理營業趨勢…" : "圖表暫時無法載入" }}</div>
      </article>
      <article class="admin-chart-card" :aria-busy="overviewLoading">
        <header class="admin-chart-heading"><div><h3>今日訂單狀態</h3><p>{{ date }} 建立的訂單，目前的處理狀態</p></div></header>
        <template v-if="overview && !overviewLoading">
          <div class="admin-chart-summary"><strong>{{ statusTotal }} <small>筆</small></strong><span>已排除已刪除訂單</span></div>
          <AdminChart v-if="statusTotal" type="doughnut" :data="statusData" :options="countDonutOptions" label="今日建立訂單的狀態分布圓環圖" />
          <div v-else class="admin-chart-empty">今天尚無訂單</div>
          <div class="admin-chart-stat-list"><span v-for="row in statusRows" :key="row.status"><i :style="{ background: row.color }"></i>{{ row.label }}<strong>{{ row.count }} 筆</strong></span></div>
        </template>
        <div v-else class="admin-chart-placeholder" role="status">{{ overviewLoading ? "正在整理訂單狀態…" : "圖表暫時無法載入" }}</div>
      </article>
    </div>

    <div class="admin-section-heading mt-7 flex-wrap"><h2><AdminIcon name="expenses" />每月營業額與成本</h2><div class="admin-month-control"><button type="button" aria-label="上個月" :disabled="!validMonth" @click="moveMonth(-1)">‹</button><input v-model="month" type="month" aria-label="圖表月份" @change="loadMonth" /><button type="button" aria-label="下個月" :disabled="!validMonth || month >= date.slice(0, 7)" @click="moveMonth(1)">›</button></div></div>
    <div v-if="monthError" class="admin-chart-error" role="alert">{{ monthError }}<button type="button" @click="loadMonth">重新載入</button></div>
    <div class="admin-charts-grid">
      <article class="admin-chart-card" :aria-busy="monthLoading">
        <header class="admin-chart-heading"><div><h3>營業額與成本比較</h3><p>成本為成本管理中登錄的金額合計</p></div></header>
        <template v-if="monthly && !monthLoading">
          <div class="admin-chart-comparison"><div><span><i class="bg-accent"></i>營業額合計</span><strong>{{ money(monthly.totalRevenue) }}</strong></div><div><span><i style="background:#728568"></i>成本合計</span><strong>{{ money(monthly.totalExpense) }}</strong></div></div>
          <AdminChart type="bar" :data="monthData" :options="amountOptions" label="所選月份每日營業額與成本比較長條圖" />
          <p v-if="monthly.totalRevenue === 0 && monthly.totalExpense === 0" class="admin-chart-note">此月份尚無營業額與成本紀錄。</p>
          <details class="admin-chart-data"><summary>查看每日數據</summary><div class="admin-table-wrap mt-3"><table class="w-full text-left text-sm"><thead><tr><th>日期</th><th>營業額</th><th>成本</th></tr></thead><tbody><tr v-for="row in monthly.daily" :key="row.date"><td>{{ row.date }}</td><td>{{ money(row.revenue) }}</td><td>{{ money(row.expense) }}</td></tr></tbody></table></div></details>
        </template>
        <div v-else class="admin-chart-placeholder" role="status">{{ monthLoading ? "正在整理每月紀錄…" : "圖表暫時無法載入" }}</div>
      </article>
      <article class="admin-chart-card" :aria-busy="monthLoading">
        <header class="admin-chart-heading"><div><h3>成本分類</h3><p>{{ month }} 已登錄成本的分布</p></div></header>
        <template v-if="monthly && !monthLoading">
          <div class="admin-chart-summary"><strong>{{ money(monthly.totalExpense) }}</strong><span v-if="hasExpenseCategories">{{ expenseCategories.length }} 種分類</span></div>
          <AdminChart v-if="monthly.totalExpense && hasExpenseCategories" type="doughnut" :data="expenseData" :options="amountDonutOptions" label="所選月份已登錄成本分類圓環圖" />
          <div v-else class="admin-chart-empty">{{ hasExpenseCategories ? "這個月尚無成本紀錄" : "成本分類暫時無法載入，請重新整理。" }}</div>
          <div class="admin-chart-stat-list"><span v-for="(row, index) in expenseCategories" :key="row.category"><i :style="{ background: categoryColor(index) }"></i>{{ row.category }}<strong>{{ money(row.amount) }}<small>{{ percent(row.amount, monthly.totalExpense) }}</small></strong></span></div>
        </template>
        <div v-else class="admin-chart-placeholder" role="status">{{ monthLoading ? "正在整理成本分類…" : "圖表暫時無法載入" }}</div>
      </article>
    </div>
    <p class="admin-chart-note mt-3">圖表可移入或輕點查看數值，點選圖例可隱藏或顯示項目。</p>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import type { ChartData, ChartOptions } from "chart.js";
import { dashboardCharts, monthlyReport } from "../api/client";
import type { DashboardChartData, MonthlyReport, OrderStatus } from "../types/admin";
import AdminChart from "./AdminChart.vue";
import AdminIcon from "./AdminIcon.vue";

const props = defineProps<{ date: string; refreshKey: number }>();
const overview = ref<DashboardChartData | null>(null);
const monthly = ref<MonthlyReport | null>(null);
const overviewLoading = ref(false);
const monthLoading = ref(false);
const overviewError = ref("");
const monthError = ref("");
const expenseCategories = computed(() => monthly.value?.expenseCategories ?? []);
const hasExpenseCategories = computed(() => Array.isArray(monthly.value?.expenseCategories));
const trendDays = ref(7);
const month = ref(props.date.slice(0, 7));
const validMonth = computed(() => /^\d{4}-(0[1-9]|1[0-2])$/.test(month.value));
let overviewRequest = 0;
let monthRequest = 0;
const money = (value: number) => `NT$ ${value.toLocaleString("zh-TW")}`;
const percent = (value: number, total: number) => `${total ? (value / total * 100).toFixed(1) : 0}%`;
const palette = ["#b85d30", "#728568", "#c69d50", "#6d94a4", "#ab7d81", "#9e8e75", "#877a9d", "#87a693", "#d69972"];
const categoryColor = (index: number) => palette[index % palette.length]!;
const statusDefinitions: { status: OrderStatus; label: string; color: string }[] = [
  { status: "PENDING", label: "待接單", color: "#c99740" }, { status: "CONFIRMED", label: "已確認", color: "#ab8861" },
  { status: "PREPARING", label: "製作中", color: "#b85d30" }, { status: "READY", label: "可取餐", color: "#6d94a4" },
  { status: "COMPLETED", label: "已完成", color: "#728568" }, { status: "CANCELLED", label: "已取消", color: "#b7aaa0" }
];
const statusRows = computed(() => statusDefinitions.map((row) => ({ ...row, count: overview.value?.orderStatuses.find((item) => item.status === row.status)?.count ?? 0 })));
const statusTotal = computed(() => statusRows.value.reduce((sum, row) => sum + row.count, 0));
const trendPoints = computed(() => overview.value?.daily.slice(-trendDays.value) ?? []);
const trendTotal = computed(() => trendPoints.value.reduce((sum, row) => sum + row.revenue, 0));
const shortDate = (date: string) => `${Number(date.slice(5, 7))}/${Number(date.slice(8))}`;
const trendData = computed<ChartData>(() => ({ labels: trendPoints.value.map((row) => shortDate(row.date)), datasets: [{ label: "營業額", data: trendPoints.value.map((row) => row.revenue), borderColor: "#b65324", backgroundColor: "#b6532418", fill: true, tension: .25, pointRadius: trendDays.value === 7 ? 3 : 1.5, pointHoverRadius: 5, borderWidth: 2.5 }] }));
const monthData = computed<ChartData>(() => ({ labels: monthly.value?.daily.map((row) => shortDate(row.date)) ?? [], datasets: [
  { label: "營業額", data: monthly.value?.daily.map((row) => row.revenue) ?? [], backgroundColor: "#bc6235", borderRadius: 3 },
  { label: "成本", data: monthly.value?.daily.map((row) => row.expense) ?? [], backgroundColor: "#728568", borderRadius: 3 }
] }));
const statusData = computed<ChartData>(() => ({ labels: statusRows.value.map((row) => row.label), datasets: [{ data: statusRows.value.map((row) => row.count), backgroundColor: statusRows.value.map((row) => row.color), borderColor: "#fffdf8", borderWidth: 3, hoverOffset: 5 }] }));
const expenseData = computed<ChartData>(() => ({ labels: expenseCategories.value.map((row) => row.category) ?? [], datasets: [{ data: expenseCategories.value.map((row) => row.amount) ?? [], backgroundColor: expenseCategories.value.map((_, index) => categoryColor(index)) ?? [], borderColor: "#fffdf8", borderWidth: 3, hoverOffset: 5 }] }));
const animation = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? false : { duration: 350 };
const baseOptions: ChartOptions = { responsive: true, maintainAspectRatio: false, animation, color: "#7d6b5c", font: { family: '"Noto Sans TC", "Microsoft JhengHei", system-ui, sans-serif', size: 12 }, plugins: { legend: { position: "bottom", labels: { usePointStyle: true, pointStyle: "circle", boxWidth: 8, boxHeight: 8, padding: 15 } }, tooltip: { backgroundColor: "#49382b", padding: 12, cornerRadius: 10 } } };
const amountOptions: ChartOptions = { ...baseOptions, interaction: { mode: "index", intersect: false }, scales: { x: { grid: { display: false }, border: { display: false }, ticks: { maxTicksLimit: 7, maxRotation: 0 } }, y: { beginAtZero: true, grid: { color: "#eee5d9" }, border: { display: false }, ticks: { maxTicksLimit: 5 } } }, plugins: { ...baseOptions.plugins, tooltip: { ...baseOptions.plugins?.tooltip, callbacks: { label: (context) => `${context.dataset.label}：${money(Number(context.parsed.y ?? 0))}` } } } };
function donutOptions(currency: boolean): ChartOptions {
  return { ...baseOptions, plugins: { ...baseOptions.plugins, tooltip: { ...baseOptions.plugins?.tooltip, callbacks: { label: (context) => { const total = context.dataset.data.reduce<number>((sum, value) => sum + Number(value), 0); const value = Number(context.parsed); return `${context.label}：${currency ? money(value) : `${value} 筆`}（${percent(value, total)}）`; } } } } };
}
const countDonutOptions = donutOptions(false);
const amountDonutOptions = donutOptions(true);

async function loadOverview(): Promise<void> {
  const request = ++overviewRequest;
  overviewLoading.value = true;
  overviewError.value = "";
  overview.value = null;
  try {
    const result = await dashboardCharts(props.date);
    if (request === overviewRequest) overview.value = result;
  } catch {
    if (request === overviewRequest) overviewError.value = "營運圖表讀取失敗，請稍後再試。";
  } finally {
    if (request === overviewRequest) overviewLoading.value = false;
  }
}

async function loadMonth(): Promise<void> {
  const request = ++monthRequest;
  monthly.value = null;
  monthError.value = "";
  if (!validMonth.value) { monthError.value = "請選擇有效月份。"; monthLoading.value = false; return; }
  monthLoading.value = true;
  try {
    const result = await monthlyReport(month.value);
    if (request === monthRequest) monthly.value = result;
  } catch {
    if (request === monthRequest) monthError.value = "每月圖表讀取失敗，請稍後再試。";
  } finally {
    if (request === monthRequest) monthLoading.value = false;
  }
}

function moveMonth(offset: number): void {
  if (!validMonth.value) return;
  const [year, value] = month.value.split("-").map(Number);
  month.value = new Date(Date.UTC(year!, value! - 1 + offset, 1)).toISOString().slice(0, 7);
  void loadMonth();
}

watch(() => [props.date, props.refreshKey], () => { void loadOverview(); void loadMonth(); }, { immediate: true });
onBeforeUnmount(() => { overviewRequest++; monthRequest++; });
</script>
