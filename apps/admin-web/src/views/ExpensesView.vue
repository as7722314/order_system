<template>
  <main class="p-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold">成本</h1>
        <p class="mt-1 text-sm text-stone-500">可依日期區間與分類查詢成本資料。</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button class="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white" type="button" @click="openCreateModal">
          新增成本
        </button>
        <button class="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium" :disabled="loading" :aria-busy="loading" type="button" @click="load">
          {{ loading ? "讀取中" : "重新整理" }}
        </button>
      </div>
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

    <p v-if="error" class="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>

    <div class="admin-table-wrap mt-5">
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
          <tr v-for="item in items" :key="item.id" class="border-b border-stone-100" :class="{ 'admin-row-updated': feedback.isHighlighted(item.id) }">
            <td class="p-3 whitespace-nowrap">{{ formatExpenseDate(item.expenseDate) }}</td>
            <td class="p-3">{{ item.category }}</td>
            <td class="p-3 font-medium text-stone-900">{{ item.name }}</td>
            <td class="p-3 whitespace-nowrap">NT$ {{ item.amount.toLocaleString("zh-TW") }}</td>
            <td class="p-3 text-stone-600">{{ item.note || "-" }}</td>
            <td class="p-3 text-right whitespace-nowrap">
              <button class="rounded-md border border-stone-300 px-3 py-2" type="button" @click="openEditModal(item)">編輯</button>
              <button class="ml-2 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-red-700" type="button" @click="remove(item)">刪除</button>
            </td>
          </tr>
          <tr v-if="items.length === 0">
            <td class="p-6 text-center text-stone-500" colspan="6">查無成本資料</td>
          </tr>
        </tbody>
      </table>
    </div>

    <AdminModal :open="isModalOpen" :title="form.id ? '編輯成本' : '新增成本'" description="填寫日期、分類、名稱與金額後儲存。" :busy="saving" @close="closeModal">
      <form id="expenses-form" @submit.prevent="submit">
        <fieldset class="grid gap-4 md:grid-cols-2" :disabled="saving">
          <label class="grid gap-1 text-sm font-medium text-stone-700">
            日期
            <input v-model="form.expenseDate" required autofocus class="rounded-md border border-stone-300 p-3 font-normal" type="date" />
          </label>
          <label class="grid gap-1 text-sm font-medium text-stone-700">
            分類
            <select v-model="form.category" class="rounded-md border border-stone-300 p-3 font-normal">
              <option v-for="category in expenseCategories" :key="category" :value="category">{{ category }}</option>
            </select>
          </label>
          <label class="grid gap-1 text-sm font-medium text-stone-700">
            名稱
            <input v-model.trim="form.name" required class="rounded-md border border-stone-300 p-3 font-normal" placeholder="名稱" />
          </label>
          <label class="grid gap-1 text-sm font-medium text-stone-700">
            金額
            <input v-model.number="form.amount" required class="rounded-md border border-stone-300 p-3 font-normal" min="1" placeholder="金額" type="number" />
          </label>
          <label class="grid gap-1 text-sm font-medium text-stone-700 md:col-span-2">
            備註
            <textarea v-model.trim="form.note" class="min-h-24 rounded-md border border-stone-300 p-3 font-normal" placeholder="備註" />
          </label>
        </fieldset>
        <p v-if="formError" role="alert" class="admin-form-error mt-4">{{ formError }}</p>
      </form>
      <template #footer>
        <button class="admin-modal-cancel" type="button" :disabled="saving" @click="closeModal">取消</button>
        <button class="admin-modal-submit bg-accent" form="expenses-form" type="submit" :disabled="saving" :aria-busy="saving">{{ saving ? "儲存中…" : "儲存" }}</button>
      </template>
    </AdminModal>
    <AdminConfirmDialog :state="confirmation" @close="closeConfirmation" @confirm="confirmAction" />
  </main>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { useAdminFeedback } from "../composables/useAdminFeedback";
import { deleteExpense, listExpenses, saveExpense } from "../api/client";
import AdminModal from "../components/AdminModal.vue";
import AdminConfirmDialog from "../components/AdminConfirmDialog.vue";
import { useConfirmation } from "../composables/useConfirmation";
import type { Expense } from "../types/admin";

const expenseCategories = ["設備", "設備費用", "日常消耗", "電費", "水費", "瓦斯費", "食材", "租金", "其他"];
const today = new Date().toISOString().slice(0, 10);
const items = ref<Expense[]>([]);
const loading = ref(false);
const saving = ref(false);
const error = ref("");
const feedback = useAdminFeedback();
const isModalOpen = ref(false);
const formError = ref("");
const { confirmation, requestConfirmation, closeConfirmation, confirmAction } = useConfirmation();
const filters = reactive({ startDate: "", endDate: "", category: "" });
const form = ref<Partial<Expense>>({ expenseDate: today, category: "日常消耗", name: "", amount: 0, note: "" });

function formatExpenseDate(value: string): string {
  return value.slice(0, 10);
}

function resetForm(): void {
  form.value = { expenseDate: today, category: "日常消耗", name: "", amount: 0, note: "" };
}

function openCreateModal(): void {
  resetForm();
  formError.value = "";
  isModalOpen.value = true;
}

function closeModal(): void {
  if (saving.value) return;
  isModalOpen.value = false;
  resetForm();
}

function resetFilters(): void {
  filters.startDate = "";
  filters.endDate = "";
  filters.category = "";
  void load();
}

function openEditModal(item: Expense): void {
  form.value = {
    ...item,
    expenseDate: formatExpenseDate(item.expenseDate),
    category: item.category || "日常消耗"
  };
  formError.value = "";
  isModalOpen.value = true;
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
  if (saving.value) return;
  saving.value = true;
  formError.value = "";
  const wasEditing = Boolean(form.value.id);
  try {
    const saved = await saveExpense({
      ...form.value,
      category: form.value.category || "日常消耗"
    });
    isModalOpen.value = false;
    resetForm();
    await load();
    feedback.highlight(saved.id);
    feedback.success(wasEditing ? "成本已儲存" : "成本已新增");
  } catch {
    formError.value = "儲存成本資料失敗，請確認日期、分類、名稱與金額。";
    feedback.error(formError.value);
  } finally {
    saving.value = false;
  }
}

function remove(item: Expense): void {
  requestConfirmation({
    title: "刪除成本",
    description: `確定刪除「${item.name}」（NT$ ${item.amount.toLocaleString("zh-TW")}）？刪除後將不再計入成本報表。`,
    confirmLabel: "確認刪除",
    danger: true,
    errorMessage: "刪除成本資料失敗，請稍後再試。",
    action: async () => {
      await deleteExpense(item.id);
      await load();
      feedback.success("成本已刪除");
    }
  });
}

onMounted(load);
</script>
