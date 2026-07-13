<template>
  <main class="p-6">
    <h1 class="text-2xl font-semibold">成本</h1>
    <form class="mt-5 grid gap-3 rounded-lg border border-stone-200 bg-white p-4 md:grid-cols-5" @submit.prevent="submit">
      <input v-model="form.expenseDate" class="rounded-md border border-stone-300 p-3" type="date" />
      <input v-model="form.name" class="rounded-md border border-stone-300 p-3" placeholder="名稱" />
      <input v-model.number="form.amount" class="rounded-md border border-stone-300 p-3" placeholder="金額" type="number" />
      <input v-model="form.note" class="rounded-md border border-stone-300 p-3" placeholder="備註" />
      <button class="rounded-md bg-accent px-4 py-3 font-medium text-white">儲存</button>
    </form>
    <table class="mt-5 w-full rounded-lg bg-white text-left text-sm">
      <tbody>
        <tr v-for="item in items" :key="item.id" class="border-b border-stone-100">
          <td class="p-3">{{ item.expenseDate.slice(0, 10) }}</td><td class="p-3">{{ item.name }}</td><td class="p-3">NT$ {{ item.amount }}</td>
          <td class="p-3 text-right"><button class="rounded-md border px-3 py-2" @click="form = { ...item, expenseDate: item.expenseDate.slice(0, 10) }">編輯</button><button class="ml-2 rounded-md border px-3 py-2" @click="remove(item.id)">刪除</button></td>
        </tr>
      </tbody>
    </table>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { deleteExpense, listExpenses, saveExpense } from "../api/client";
import type { Expense } from "../types/admin";

const today = new Date().toISOString().slice(0, 10);
const items = ref<Expense[]>([]);
const form = ref<Partial<Expense>>({ expenseDate: today, name: "", amount: 0, note: "" });

async function load(): Promise<void> { items.value = await listExpenses(); }
async function submit(): Promise<void> { await saveExpense(form.value); form.value = { expenseDate: today, name: "", amount: 0, note: "" }; await load(); }
async function remove(id: string): Promise<void> { await deleteExpense(id); await load(); }
onMounted(load);
</script>
