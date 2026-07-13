<template>
  <main class="p-6">
    <div class="flex items-center justify-between gap-4">
      <h1 class="text-2xl font-semibold">口味</h1>
      <button class="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium" @click="resetForm">新增口味</button>
    </div>

    <form class="mt-5 grid gap-3 rounded-lg border border-stone-200 bg-white p-4 md:grid-cols-5" @submit.prevent="submit">
      <input v-model="form.name" class="rounded-md border border-stone-300 p-3" placeholder="名稱" />
      <input v-model.number="form.extraPrice" class="rounded-md border border-stone-300 p-3" placeholder="加價" type="number" />
      <input v-model.number="form.sortOrder" class="rounded-md border border-stone-300 p-3" placeholder="排序" type="number" />
      <label class="flex items-center gap-2"><input v-model="form.isActive" type="checkbox" /> 啟用</label>
      <div class="flex gap-2">
        <button class="rounded-md bg-accent px-4 py-3 font-medium text-white" :disabled="saving">{{ form.id ? "儲存變更" : "新增口味" }}</button>
        <button v-if="form.id" class="rounded-md border border-stone-300 px-4 py-3" type="button" @click="resetForm">取消編輯</button>
      </div>
      <p v-if="message" class="text-sm text-stone-600 md:col-span-5">{{ message }}</p>
      <p v-if="error" class="text-sm text-red-600 md:col-span-5">{{ error }}</p>
    </form>

    <table class="mt-5 w-full rounded-lg bg-white text-left text-sm">
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
    </table>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { listFlavors, saveFlavor } from "../api/client";
import type { Flavor } from "../types/admin";

const items = ref<Flavor[]>([]);
const form = ref<Partial<Flavor>>({ name: "", extraPrice: 0, sortOrder: 0, isActive: true });
const saving = ref(false);
const message = ref("");
const error = ref("");

function resetForm(): void {
  form.value = { name: "", extraPrice: 0, sortOrder: 0, isActive: true };
  message.value = "";
  error.value = "";
}

function edit(item: Flavor): void {
  form.value = { ...item };
  message.value = `正在編輯：${item.name}`;
  error.value = "";
}

async function load(): Promise<void> {
  items.value = await listFlavors();
}

async function submit(): Promise<void> {
  saving.value = true;
  message.value = "";
  error.value = "";
  try {
    await saveFlavor(form.value);
    message.value = form.value.id ? "口味已儲存" : "口味已新增";
    resetForm();
    await load();
  } catch {
    error.value = "口味儲存失敗";
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>
