<template>
  <main class="p-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold">成本</h1>
        <p class="mt-1 text-sm text-stone-500">可依日期區間與分類查詢成本資料。</p>
      </div>
      <button class="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium" :disabled="loading" type="button" @click="load">
        {{ loading ? "讀取中" : "重新整理" }}
      </button>
    </div>

    <section class="mt-5 rounded-lg border border-stone-200 bg-white p-4">
      <h2 class="text-lg font-semibold text-stone-900">查詢條件</h2>
      <form class="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto_auto]" @submit.prevent="load">
        <label class="grid gap-1 text-sm font-medium text-stone-700">
          起始日期
          <input v-model="filters.startDate" class="rounded-md border border-stone-300 p-3 font-normal" type="date" />
        </label>
        <label class="grid gap-1 text-sm font-medium text-stone-700">
          結束日期
          <input v-model="filters.endDate" class="rounded-md border border-stone-300 p-3 font-normal" type="date" />
        </label>
        <label class="grid gap-1 text-sm font-medium text-stone-700">
          分類
          <select v-model="filters.category" class="rounded-md border border-stone-300 p-3 font-normal">
            <option value="">全部分類</option>
            <option v-for="category in expenseCategories" :key="category" :value="category">{{ category }}</option>
          </select>
        </label>
        <button class="self-end rounded-md bg-accent px-4 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50" :disabled="loading" type="submit">查詢</button>
        <button class="self-end rounded-md border border-stone-300 px-4 py-3 font-medium text-stone-700" :disabled="loading" type="button" @click="resetFilters">清除</button>
      </form>
    </section>

    <form class="mt-5 grid gap-3 rounded-lg border border-stone-200 bg-white p-4 md:grid-cols-6" @submit.prevent="submit">
      <label class="grid gap-1 text-sm font-medium text-stone-700">
        日期
        <input v-model="form.expenseDate" class="rounded-md border border-stone-300 p-3 font-normal" type="date" />
      </label>
      <label class="grid gap-1 text-sm font-medium text-stone-700">
        分類
        <select v-model="form.category" class="rounded-md border border-stone-300 p-3 font-normal">
          <option v-for="category in expenseCategories" :key="category" :value="category">{{ category }}</option>
        </select>
      </label>
      <label class="grid gap-1 text-sm font-medium text-stone-700">
        名稱
        <input v-model.trim="form.name" class="rounded-md border border-stone-300 p-3 font-normal" placeholder="名稱" />
      </label>
      <label class="grid gap-1 text-sm font-medium text-stone-700">
        金額
        <input v-model.number="form.amount" class="rounded-md border border-stone-300 p-3 font-normal" min="1" placeholder="金額" type="number" />
      </label>
      <label class="grid gap-1 text-sm font-medium text-stone-700 md:col-span-2">
        備註
        <input v-model.trim="form.note" class="rounded-md border border-stone-300 p-3 font-normal" placeholder="備註" />
      </label>
      <div class="flex gap-2 md:col-span-6">
        <button class="rounded-md bg-accent px-4 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50" :disabled="saving" type="submit">{{ form.id ? "儲存變更" : "新增成本" }}</button>
        <button v-if="form.id" class="rounded-md border border-stone-300 px-4 py-3 font-medium text-stone-700" :disabled="saving" type="button" @click="resetForm">取消編輯</button>
      </div>
    </form>

    <p v-if="error" class="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>

    <div class="mt-5 overflow-x-auto rounded-lg bg-white">
      <table class="w-full text-left text-sm">
        <thead class="bg-stone-100 text-stone-600">
          <tr>
            <th class="p-3">日期</th>
            <th class="p-3">分類</th>
            <th class="p-3">名稱</th>
            <th class="p-3">金額</th>
            <th class="p-3">備註</th>
            <th class="p-3 text-right">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id" class="border-b border-stone-100">
            <td class="p-3 whitespace-nowrap">{{ formatExpenseDate(item.expenseDate) }}</td>
            <td class="p-3">{{ item.category }}</td>
            <td class="p-3 font-medium text-stone-900">{{ item.name }}</td>
            <td class="p-3 whitespace-nowrap">NT$ {{ item.amount.toLocaleString("zh-TW") }}</td>
            <td class="p-3 text-stone-600">{{ item.note || "-" }}</td>
            <td class="p-3 text-right">
              <button class="rounded-md border border-stone-300 px-3 py-2" type="button" @click="edit(item)">編輯</button>
              <button class="ml-2 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-red-700" type="button" @click="remove(item.id)">刪除</button>
            </td>
          </tr>
          <tr v-if="items.length === 0">
            <td class="p-6 text-center text-stone-500" colspan="6">查無成本資料</td>
          </tr>
        </tbody>
      </table>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { deleteExpense, listExpenses, saveExpense } from "../api/client";
import type { Expense } from "../types/admin";

const expenseCategories = ["設備費用", "日常消耗", "電費", "水費", "瓦斯費", "食材", "租金", "其他"];
const today = new Date().toISOString().slice(0, 10);
const items = ref<Expense[]>([]);
const loading = ref(false);
const saving = ref(false);
const error = ref("");
const filters = reactive({ startDate: "", endDate: "", category: "" });
const form = ref<Partial<Expense>>({ expenseDate: today, category: "日常消耗", name: "", amount: 0, note: "" });

function formatExpenseDate(value: string): string {
  return value.slice(0, 10);
}

function resetForm(): void {
  form.value = { expenseDate: today, category: "日常消耗", name: "", amount: 0, note: "" };
}

function resetFilters(): void {
  filters.startDate = "";
  filters.endDate = "";
  filters.category = "";
  void load();
}

function edit(item: Expense): void {
  form.value = {
    ...item,
    expenseDate: formatExpenseDate(item.expenseDate),
    category: item.category || "日常消耗"
  };
}

async function load(): Promise<void> {
  loading.value = true;
  error.value = "";
  try {
    items.value = await listExpenses({
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      category: filters.category || undefined,
      pageSize: 100
    });
  } catch {
    error.value = "讀取成本資料失敗";
  } finally {
    loading.value = false;
  }
}

async function submit(): Promise<void> {
  saving.value = true;
  error.value = "";
  try {
    await saveExpense({
      ...form.value,
      category: form.value.category || "日常消耗"
    });
    resetForm();
    await load();
  } catch {
    error.value = "儲存成本資料失敗，請確認日期、分類、名稱與金額。";
  } finally {
    saving.value = false;
  }
}

async function remove(id: string): Promise<void> {
  const confirmed = window.confirm("確定要刪除此成本資料？");
  if (!confirmed) return;
  try {
    await deleteExpense(id);
    await load();
  } catch {
    error.value = "刪除成本資料失敗";
  }
}

onMounted(load);
</script>
