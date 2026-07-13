<template>
  <main class="p-6">
    <div class="flex items-center justify-between gap-4">
      <h1 class="text-2xl font-semibold">商品</h1>
      <button class="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium" @click="resetForm">新增商品</button>
    </div>

    <form class="mt-5 grid gap-3 rounded-lg border border-stone-200 bg-white p-4 md:grid-cols-4" @submit.prevent="submit">
      <input v-model="form.name" class="rounded-md border border-stone-300 p-3 md:col-span-2" placeholder="商品名稱" />
      <input v-model.number="form.price" class="rounded-md border border-stone-300 p-3" placeholder="售價" type="number" />
      <input v-model.number="form.sortOrder" class="rounded-md border border-stone-300 p-3" placeholder="排序" type="number" />
      <label class="flex items-center gap-2"><input v-model="form.isActive" type="checkbox" /> 啟用</label>
      <textarea v-model="form.description" class="rounded-md border border-stone-300 p-3 md:col-span-3" placeholder="商品說明"></textarea>
      <fieldset class="md:col-span-4">
        <legend class="mb-2 text-sm font-medium text-stone-700">可選口味</legend>
        <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <label v-for="flavor in activeFlavors" :key="flavor.id" class="flex items-center gap-2 rounded-md border border-stone-200 p-3 text-sm">
            <input v-model="selectedFlavorIds" type="checkbox" :value="flavor.id" />
            <span>{{ flavor.name }} <span v-if="flavor.extraPrice">+{{ flavor.extraPrice }}</span></span>
          </label>
        </div>
        <p v-if="activeFlavors.length === 0" class="text-sm text-red-600">目前沒有啟用口味，請先到口味管理新增或啟用口味。</p>
      </fieldset>
      <div class="flex gap-2 md:col-span-4">
        <button class="rounded-md bg-accent px-4 py-3 font-medium text-white" :disabled="saving">{{ form.id ? "儲存變更" : "新增商品" }}</button>
        <button v-if="form.id" class="rounded-md border border-stone-300 px-4 py-3" type="button" @click="resetForm">取消編輯</button>
      </div>
      <p v-if="message" class="text-sm text-stone-600 md:col-span-4">{{ message }}</p>
      <p v-if="error" class="text-sm text-red-600 md:col-span-4">{{ error }}</p>
    </form>

    <table class="mt-5 w-full overflow-hidden rounded-lg bg-white text-left text-sm">
      <thead class="bg-stone-100 text-stone-600">
        <tr>
          <th class="p-3">名稱</th>
          <th class="p-3">售價</th>
          <th class="p-3">口味</th>
          <th class="p-3">排序</th>
          <th class="p-3">狀態</th>
          <th class="p-3 text-right">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in items" :key="item.id" class="border-b border-stone-100">
          <td class="p-3">
            <div class="font-medium">{{ item.name }}</div>
            <div class="mt-1 text-xs text-stone-500">{{ item.description }}</div>
          </td>
          <td class="p-3">NT$ {{ item.price }}</td>
          <td class="p-3 text-xs text-stone-600">{{ flavorNames(item) }}</td>
          <td class="p-3">{{ item.sortOrder }}</td>
          <td class="p-3">{{ item.isActive ? "啟用" : "停用" }}</td>
          <td class="p-3 text-right">
            <button class="rounded-md border border-stone-300 px-3 py-2" @click="edit(item)">編輯</button>
            <button class="ml-2 rounded-md bg-red-600 px-3 py-2 text-white" @click="remove(item)">刪除</button>
          </td>
        </tr>
      </tbody>
    </table>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { deleteProduct, listFlavors, listProducts, saveProduct } from "../api/client";
import type { Flavor, Product } from "../types/admin";

const items = ref<Product[]>([]);
const flavors = ref<Flavor[]>([]);
const activeFlavors = computed(() => flavors.value.filter((flavor) => flavor.isActive));
const selectedFlavorIds = ref<string[]>([]);
const saving = ref(false);
const message = ref("");
const error = ref("");
const form = ref<Partial<Product>>({ name: "", price: 0, sortOrder: 0, isActive: true, description: "" });

function allActiveFlavorIds(): string[] {
  return activeFlavors.value.map((flavor) => flavor.id);
}

function resetForm(): void {
  form.value = { name: "", price: 0, sortOrder: 0, isActive: true, description: "" };
  selectedFlavorIds.value = allActiveFlavorIds();
  message.value = "";
  error.value = "";
}

function edit(item: Product): void {
  form.value = { ...item, categoryId: undefined };
  selectedFlavorIds.value = item.productFlavors?.map((productFlavor) => productFlavor.flavorId) ?? allActiveFlavorIds();
  message.value = `正在編輯：${item.name}`;
  error.value = "";
}

function flavorNames(item: Product): string {
  const names = item.productFlavors?.map((productFlavor) => productFlavor.flavor.name).filter(Boolean) ?? [];
  return names.length > 0 ? names.join("、") : "尚未設定";
}

async function load(): Promise<void> {
  const [productItems, flavorItems] = await Promise.all([listProducts(), listFlavors()]);
  items.value = productItems;
  flavors.value = flavorItems;
  if (!form.value.id && selectedFlavorIds.value.length === 0) selectedFlavorIds.value = allActiveFlavorIds();
}

async function submit(): Promise<void> {
  saving.value = true;
  message.value = "";
  error.value = "";
  try {
    const wasEditing = Boolean(form.value.id);
    await saveProduct({ ...form.value, flavorIds: selectedFlavorIds.value });
    resetForm();
    await load();
    message.value = wasEditing ? "商品已儲存" : "商品已新增";
  } catch {
    error.value = "商品儲存失敗，請確認商品名稱、售價與口味設定。";
  } finally {
    saving.value = false;
  }
}

async function remove(item: Product): Promise<void> {
  const confirmed = window.confirm(`確定要刪除商品「${item.name}」？此操作會移除商品，但歷史訂單仍保留商品快照。`);
  if (!confirmed) return;
  const secondConfirmed = window.confirm("請再次確認：刪除後商品將不會出現在管理列表與顧客端。確定刪除？");
  if (!secondConfirmed) return;
  await deleteProduct(item.id);
  if (form.value.id === item.id) resetForm();
  await load();
}

onMounted(async () => {
  await load();
  resetForm();
});
</script>


