<template>
  <main class="p-6">
    <h1 class="text-2xl font-semibold">分類</h1>
    <form class="mt-5 grid gap-3 rounded-lg border border-stone-200 bg-white p-4 md:grid-cols-4" @submit.prevent="submit">
      <input v-model="form.name" class="rounded-md border border-stone-300 p-3" placeholder="名稱" />
      <input v-model.number="form.sortOrder" class="rounded-md border border-stone-300 p-3" placeholder="排序" type="number" />
      <label class="flex items-center gap-2"><input v-model="form.isActive" type="checkbox" /> 啟用</label>
      <button class="rounded-md bg-accent px-4 py-3 font-medium text-white">儲存</button>
    </form>
    <table class="mt-5 w-full overflow-hidden rounded-lg bg-white text-left text-sm">
      <tbody>
        <tr v-for="item in items" :key="item.id" class="border-b border-stone-100">
          <td class="p-3">{{ item.name }}</td><td class="p-3">{{ item.sortOrder }}</td><td class="p-3">{{ item.isActive ? "啟用" : "停用" }}</td>
          <td class="p-3 text-right"><button class="rounded-md border px-3 py-2" @click="form = { ...item }">編輯</button></td>
        </tr>
      </tbody>
    </table>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { listCategories, saveCategory } from "../api/client";
import type { Category } from "../types/admin";

const items = ref<Category[]>([]);
const form = ref<Partial<Category>>({ name: "", sortOrder: 0, isActive: true });

async function load(): Promise<void> { items.value = await listCategories(); }
async function submit(): Promise<void> { await saveCategory(form.value); form.value = { name: "", sortOrder: 0, isActive: true }; await load(); }
onMounted(load);
</script>
