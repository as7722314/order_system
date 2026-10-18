<template>
  <main class="p-6">
    <div class="flex items-center justify-between gap-4">
      <div><p class="admin-eyebrow">餐點設定</p><h1 class="text-2xl font-semibold">口味</h1><p class="mt-2 text-sm text-stone-500">管理每一種好滋味，設定加價與顯示順序。</p></div>
      <button class="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white" @click="openCreateModal">新增口味</button>
    </div>

    <p v-if="message" role="status" class="mt-4 text-sm text-stone-600">{{ message }}</p>
    <p v-if="error" role="alert" class="admin-form-error mt-4">{{ error }}</p>

    <div class="admin-table-wrap mt-5"><table class="w-full rounded-lg bg-white text-left text-sm">
      <thead class="bg-stone-100 text-stone-600">
        <tr>
          <th class="p-3">名稱</th>
          <th class="p-3">加價</th>
          <th class="p-3">排序</th>
          <th class="p-3">狀態</th>
          <th class="p-3 text-right">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in items" :key="item.id" class="border-b border-stone-100">
          <td class="p-3 font-medium">{{ item.name }}</td>
          <td class="p-3">NT$ {{ item.extraPrice }}</td>
          <td class="p-3">{{ item.sortOrder }}</td>
          <td class="p-3">{{ item.isActive ? "啟用" : "停用" }}</td>
          <td class="p-3 text-right">
            <button class="rounded-md border border-stone-300 px-3 py-2" @click="edit(item)">編輯</button>
          </td>
        </tr>
      </tbody>
    </table></div>
    <AdminModal :open="isModalOpen" :title="form.id ? '編輯口味' : '新增口味'" description="設定口味名稱、加價與顯示順序。" :busy="saving" @close="closeModal">
      <form id="flavors-form" @submit.prevent="submit">
        <fieldset class="grid gap-4 md:grid-cols-4" :disabled="saving">
          <label class="grid gap-2 text-sm font-medium text-stone-700 md:col-span-2">口味名稱<input v-model.trim="form.name" required autofocus class="w-full rounded-md border border-stone-300 p-3 font-normal" placeholder="名稱" /></label>
          <label class="grid gap-2 text-sm font-medium text-stone-700">加價<input v-model.number="form.extraPrice" class="w-full rounded-md border border-stone-300 p-3 font-normal" placeholder="加價" min="0" required type="number" /></label>
          <label class="grid gap-2 text-sm font-medium text-stone-700">排序<input v-model.number="form.sortOrder" class="w-full rounded-md border border-stone-300 p-3 font-normal" placeholder="排序" type="number" /></label>
          <label class="flex items-center gap-2"><input v-model="form.isActive" type="checkbox" /> 啟用</label>
        </fieldset>
        <p v-if="formError" role="alert" class="admin-form-error mt-4">{{ formError }}</p>
      </form>
      <template #footer>
        <button class="admin-modal-cancel" type="button" :disabled="saving" @click="closeModal">取消</button>
        <button class="admin-modal-submit bg-accent" form="flavors-form" type="submit" :disabled="saving">{{ saving ? "儲存中…" : form.id ? "儲存變更" : "新增口味" }}</button>
      </template>
    </AdminModal>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { listFlavors, saveFlavor } from "../api/client";
import AdminModal from "../components/AdminModal.vue";
import type { Flavor } from "../types/admin";

const items = ref<Flavor[]>([]);
const form = ref<Partial<Flavor>>({ name: "", extraPrice: 0, sortOrder: 0, isActive: true });
const isModalOpen = ref(false);
const saving = ref(false);
const formError = ref("");
const message = ref("");
const error = ref("");

function resetForm(): void {
  form.value = { name: "", extraPrice: 0, sortOrder: 0, isActive: true };
  formError.value = "";
}

function openCreateModal(): void {
  resetForm();
  message.value = "";
  isModalOpen.value = true;
}

function closeModal(): void {
  if (saving.value) return;
  isModalOpen.value = false;
  resetForm();
}

function edit(item: Flavor): void {
  form.value = { ...item };
  message.value = "";
  formError.value = "";
  isModalOpen.value = true;
}

async function load(): Promise<void> {
  try {
    items.value = await listFlavors();
    error.value = "";
  } catch {
    error.value = "讀取口味資料失敗，請重新整理頁面。";
  }
}

async function submit(): Promise<void> {
  if (saving.value) return;
  saving.value = true;
  formError.value = "";
  const wasEditing = Boolean(form.value.id);
  try {
    await saveFlavor(form.value);
    isModalOpen.value = false;
    resetForm();
    message.value = wasEditing ? "口味已儲存" : "口味已新增";
    await load();
  } catch {
    formError.value = "口味儲存失敗，請稍後再試。";
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>
