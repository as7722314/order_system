<template>
  <main class="p-6">
    <div class="flex items-center justify-between gap-4">
      <div><p class="admin-eyebrow">餐點設定</p><h1 class="text-2xl font-semibold">商品</h1><p class="mt-2 text-sm text-stone-500">維護餐點內容、售價與可選口味。</p></div>
      <button class="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50" :disabled="loading" @click="openCreateModal">新增商品</button>
    </div>

    <p v-if="message" role="status" class="mt-4 text-sm text-stone-600">{{ message }}</p>
    <p v-if="error" role="alert" class="admin-form-error mt-4">{{ error }}</p>

    <div class="admin-table-wrap mt-5"><table class="w-full overflow-hidden rounded-lg bg-white text-left text-sm">
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
    </table></div>
    <AdminModal :open="isModalOpen" :title="form.id ? '編輯商品' : '新增商品'" description="設定餐點內容、售價與可選口味。" :busy="saving" @close="closeModal">
      <form id="products-form" @submit.prevent="submit">
        <fieldset class="grid gap-4 md:grid-cols-4" :disabled="saving">
          <label class="grid gap-2 text-sm font-medium text-stone-700 md:col-span-2">商品名稱<input v-model.trim="form.name" required autofocus class="w-full rounded-md border border-stone-300 p-3 font-normal" placeholder="商品名稱" /></label>
          <label class="grid gap-2 text-sm font-medium text-stone-700">售價<input v-model.number="form.price" class="w-full rounded-md border border-stone-300 p-3 font-normal" placeholder="售價" min="0" required type="number" /></label>
          <label class="grid gap-2 text-sm font-medium text-stone-700">排序<input v-model.number="form.sortOrder" class="w-full rounded-md border border-stone-300 p-3 font-normal" placeholder="排序" type="number" /></label>
          <label class="flex items-center gap-2"><input v-model="form.isActive" type="checkbox" /> 啟用</label>
          <label class="grid gap-2 text-sm font-medium text-stone-700 md:col-span-3">商品說明<textarea v-model="form.description" class="w-full rounded-md border border-stone-300 p-3 font-normal" placeholder="商品說明"></textarea></label>
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
      </fieldset>
      <p v-if="formError" role="alert" class="admin-form-error mt-4">{{ formError }}</p>
      </form>
      <template #footer>
        <button class="admin-modal-cancel" type="button" :disabled="saving" @click="closeModal">取消</button>
        <button class="admin-modal-submit bg-accent" form="products-form" type="submit" :disabled="saving">{{ saving ? "儲存中…" : form.id ? "儲存變更" : "新增商品" }}</button>
      </template>
    </AdminModal>
    <AdminConfirmDialog :state="confirmation" @close="closeConfirmation" @confirm="confirmAction" />
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { deleteProduct, listFlavors, listProducts, saveProduct } from "../api/client";
import AdminModal from "../components/AdminModal.vue";
import AdminConfirmDialog from "../components/AdminConfirmDialog.vue";
import { useConfirmation } from "../composables/useConfirmation";
import type { Flavor, Product } from "../types/admin";

const items = ref<Product[]>([]);
const flavors = ref<Flavor[]>([]);
const activeFlavors = computed(() => flavors.value.filter((flavor) => flavor.isActive));
const selectedFlavorIds = ref<string[]>([]);
const loading = ref(true);
const isModalOpen = ref(false);
const saving = ref(false);
const formError = ref("");
const { confirmation, requestConfirmation, closeConfirmation, confirmAction } = useConfirmation();
const message = ref("");
const error = ref("");
const form = ref<Partial<Product>>({ name: "", price: 0, sortOrder: 0, isActive: true, description: "" });

function allActiveFlavorIds(): string[] {
  return activeFlavors.value.map((flavor) => flavor.id);
}

function resetForm(): void {
  form.value = { name: "", price: 0, sortOrder: 0, isActive: true, description: "" };
  selectedFlavorIds.value = allActiveFlavorIds();
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

function edit(item: Product): void {
  form.value = { ...item, categoryId: undefined };
  selectedFlavorIds.value = item.productFlavors?.map((productFlavor) => productFlavor.flavorId) ?? allActiveFlavorIds();
  message.value = "";
  formError.value = "";
  isModalOpen.value = true;
}

function flavorNames(item: Product): string {
  const names = item.productFlavors?.map((productFlavor) => productFlavor.flavor.name).filter(Boolean) ?? [];
  return names.length > 0 ? names.join("、") : "尚未設定";
}

async function load(): Promise<void> {
  loading.value = true;
  try {
    const [productItems, flavorItems] = await Promise.all([listProducts(), listFlavors()]);
    items.value = productItems;
    flavors.value = flavorItems;
    error.value = "";
  } catch {
    error.value = "讀取商品資料失敗，請重新整理頁面。";
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
    await saveProduct({ ...form.value, flavorIds: selectedFlavorIds.value });
    isModalOpen.value = false;
    resetForm();
    message.value = wasEditing ? "商品已儲存" : "商品已新增";
    await load();
  } catch {
    formError.value = "商品儲存失敗，請確認商品名稱、售價與口味設定。";
  } finally {
    saving.value = false;
  }
}

function remove(item: Product): void {
  requestConfirmation({
    title: "刪除商品",
    description: `確定刪除「${item.name}」？商品會從管理列表與顧客端永久移除，歷史訂單仍保留商品快照。`,
    confirmLabel: "確認刪除",
    danger: true,
    errorMessage: "刪除商品失敗，請稍後再試。",
    action: async () => {
      await deleteProduct(item.id);
      message.value = "商品已刪除";
      await load();
    }
  });
}

onMounted(load);
</script>


