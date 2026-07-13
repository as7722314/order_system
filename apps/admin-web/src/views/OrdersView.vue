<template>
  <main class="p-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold">訂單</h1>
        <p class="mt-1 text-sm text-stone-500">刪除後會移到已刪除區，可再復原。</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button class="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white" :disabled="loading" @click="openBackfillModal">補單</button>
        <button class="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm" :disabled="loading" @click="load">重新整理</button>
      </div>
    </div>

    <div class="mt-5 inline-flex rounded-lg border border-stone-200 bg-white p-1 text-sm font-medium">
      <button
        class="rounded-md px-4 py-2"
        :class="viewMode === 'active' ? 'bg-accent text-white' : 'text-stone-600 hover:bg-stone-100'"
        type="button"
        @click="selectView('active')"
      >
        一般訂單
      </button>
      <button
        class="rounded-md px-4 py-2"
        :class="viewMode === 'deleted' ? 'bg-accent text-white' : 'text-stone-600 hover:bg-stone-100'"
        type="button"
        @click="selectView('deleted')"
      >
        已刪除
      </button>
    </div>

    <div class="mt-5 overflow-x-auto rounded-lg bg-white">
      <table class="w-full text-left text-sm">
        <thead class="bg-stone-100 text-stone-600">
          <tr>
            <th class="p-3">訂單編號</th>
            <th class="p-3">建立時間</th>
            <th v-if="viewMode === 'deleted'" class="p-3">刪除時間</th>
            <th class="p-3">客戶</th>
            <th class="p-3">手機</th>
            <th class="p-3">狀態</th>
            <th class="p-3">金額</th>
            <th v-if="viewMode === 'deleted'" class="p-3">刪除原因</th>
            <th class="p-3 text-right">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in orders" :key="order.id" class="border-b border-stone-100">
            <td class="p-3 font-medium">{{ order.orderNumber }}</td>
            <td class="p-3 whitespace-nowrap text-stone-600">{{ formatDateTime(order.createdAt) }}</td>
            <td v-if="viewMode === 'deleted'" class="p-3 whitespace-nowrap text-stone-600">{{ order.deletedAt ? formatDateTime(order.deletedAt) : '-' }}</td>
            <td class="p-3">{{ order.customerName }}</td>
            <td class="p-3">{{ order.customerPhone }}</td>
            <td class="p-3"><StatusBadge :status="order.status" /></td>
            <td class="p-3">NT$ {{ order.totalAmount }}</td>
            <td v-if="viewMode === 'deleted'" class="p-3 max-w-xs text-stone-600">{{ order.deletedReason || '未填寫' }}</td>
            <td class="p-3 text-right">
              <div class="flex flex-wrap justify-end gap-2">
                <template v-if="viewMode === 'active'">
                  <button
                    v-for="action in statusActions(order.status)"
                    :key="action.status"
                    class="rounded-md px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
                    :class="action.className"
                    :disabled="loading"
                    @click="changeStatus(order.id, action.status)"
                  >
                    {{ action.label }}
                  </button>
                  <button
                    v-if="canCancel(order.status)"
                    class="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    :disabled="loading"
                    @click="cancel(order)"
                  >
                    取消
                  </button>
                  <button
                    class="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                    :disabled="loading"
                    @click="softDelete(order)"
                  >
                    刪除
                  </button>
                </template>
                <template v-else>
                  <button
                    class="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    :disabled="loading"
                    @click="restore(order)"
                  >
                    復原
                  </button>
                </template>
              </div>
            </td>
          </tr>
          <tr v-if="orders.length === 0">
            <td :colspan="viewMode === 'deleted' ? 9 : 7" class="p-6 text-center text-stone-500">
              {{ viewMode === 'deleted' ? '目前沒有已刪除訂單' : '目前沒有訂單' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="message" class="mt-3 text-sm text-emerald-700">{{ message }}</p>
    <p v-if="error" class="mt-3 text-sm text-red-600">{{ error }}</p>

    <div v-if="backfillOpen" class="fixed inset-0 z-50 overflow-y-auto bg-black/40 px-4 py-6">
      <form class="mx-auto w-full max-w-4xl rounded-lg bg-white p-5 shadow-xl" @submit.prevent="submitBackfill">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 class="text-xl font-semibold text-stone-900">補單</h2>
            <p class="mt-1 text-sm text-stone-500">送出後會直接建立已完成訂單，並計入報表營收。</p>
          </div>
          <button class="rounded-full p-2 text-stone-500 hover:bg-stone-100" title="關閉" type="button" @click="closeBackfillModal">
            <svg aria-hidden="true" class="h-5 w-5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <div class="mt-5 grid gap-3 md:grid-cols-3">
          <label class="grid gap-1 text-sm font-medium text-stone-700">
            客戶名稱
            <input v-model.trim="backfillForm.customerName" class="rounded-md border border-stone-300 p-3 font-normal" placeholder="現場補單" />
          </label>
          <label class="grid gap-1 text-sm font-medium text-stone-700">
            電話
            <input v-model.trim="backfillForm.customerPhone" class="rounded-md border border-stone-300 p-3 font-normal" placeholder="未提供" />
          </label>
          <label class="grid gap-1 text-sm font-medium text-stone-700 md:col-span-3">
            備註
            <textarea v-model.trim="backfillForm.note" class="min-h-20 rounded-md border border-stone-300 p-3 font-normal" placeholder="補單原因或備註"></textarea>
          </label>
        </div>

        <div class="mt-5 space-y-3">
          <div class="flex items-center justify-between gap-3">
            <h3 class="font-semibold text-stone-900">商品明細</h3>
            <button class="rounded-md border border-stone-300 px-3 py-2 text-sm" type="button" @click="addBackfillLine">新增品項</button>
          </div>

          <section v-for="line in backfillLines" :key="line.localId" class="rounded-lg border border-stone-200 p-4">
            <div class="grid gap-3 lg:grid-cols-[1fr_120px_auto]">
              <label class="grid gap-1 text-sm font-medium text-stone-700">
                商品
                <select v-model="line.productId" class="rounded-md border border-stone-300 p-3 font-normal" @change="resetBackfillLineFlavors(line)">
                  <option value="">請選擇商品</option>
                  <option v-for="product in activeProducts" :key="product.id" :value="product.id">{{ product.name }} / NT$ {{ product.price }}</option>
                </select>
              </label>
              <label class="grid gap-1 text-sm font-medium text-stone-700">
                數量
                <input v-model.number="line.quantity" class="rounded-md border border-stone-300 p-3 font-normal" min="1" type="number" />
              </label>
              <button class="self-end rounded-md border border-red-300 px-3 py-3 text-sm font-medium text-red-700" :disabled="backfillLines.length === 1" type="button" @click="removeBackfillLine(line.localId)">移除</button>
            </div>

            <div v-if="line.productId" class="mt-3">
              <p class="mb-2 text-sm font-medium text-stone-700">口味，最多 2 個</p>
              <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <label v-for="flavor in flavorOptionsForProduct(line.productId)" :key="flavor.id" class="flex items-center gap-2 rounded-md border border-stone-200 p-3 text-sm">
                  <input :checked="line.flavorIds.includes(flavor.id)" type="checkbox" @change="toggleBackfillFlavor(line, flavor.id, $event)" />
                  <span>{{ flavor.name }} <span v-if="flavor.extraPrice">+{{ flavor.extraPrice }}</span></span>
                </label>
              </div>
              <p v-if="flavorOptionsForProduct(line.productId).length === 0" class="text-sm text-stone-500">此商品目前沒有可選口味。</p>
            </div>

            <div class="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
              <input v-model.trim="line.note" class="rounded-md border border-stone-300 p-3 text-sm" placeholder="品項備註" />
              <p class="self-center text-right text-sm font-semibold text-stone-900">小計 NT$ {{ lineSubtotal(line) }}</p>
            </div>
          </section>
        </div>

        <div class="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-4">
          <p class="text-lg font-semibold text-stone-900">總計 NT$ {{ backfillTotal }}</p>
          <div class="flex gap-2">
            <button class="rounded-md border border-stone-300 px-4 py-3" type="button" @click="closeBackfillModal">取消</button>
            <button class="rounded-md bg-accent px-4 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50" :disabled="savingBackfill || activeProducts.length === 0">{{ savingBackfill ? "補單中" : "建立已完成訂單" }}</button>
          </div>
        </div>
        <p v-if="backfillError" class="mt-3 text-sm text-red-600">{{ backfillError }}</p>
      </form>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { cancelOrder, createBackfillOrder, deleteOrder, listFlavors, listOrders, listProducts, restoreOrder, updateOrderStatus } from "../api/client";
import StatusBadge from "../components/StatusBadge.vue";
import type { Flavor, Order, OrderStatus, Product } from "../types/admin";
import { canCancel, statusActions } from "../utils/orderStatusActions";

type OrderViewMode = "active" | "deleted";
type BackfillLine = {
  localId: string;
  productId: string;
  quantity: number;
  flavorIds: string[];
  note: string;
};

const orders = ref<Order[]>([]);
const products = ref<Product[]>([]);
const flavors = ref<Flavor[]>([]);
const viewMode = ref<OrderViewMode>("active");
const loading = ref(false);
const savingBackfill = ref(false);
const backfillOpen = ref(false);
const error = ref("");
const message = ref("");
const backfillError = ref("");
const backfillForm = reactive({ customerName: "現場補單", customerPhone: "未提供", note: "" });
const backfillLines = ref<BackfillLine[]>([]);

const activeProducts = computed(() => products.value.filter((product) => product.isActive));
const activeFlavors = computed(() => flavors.value.filter((flavor) => flavor.isActive));
const backfillTotal = computed(() => backfillLines.value.reduce((sum, line) => sum + lineSubtotal(line), 0));

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(value));
}

function newBackfillLine(): BackfillLine {
  return { localId: crypto.randomUUID(), productId: "", quantity: 1, flavorIds: [], note: "" };
}

function selectedProduct(productId: string): Product | undefined {
  return products.value.find((product) => product.id === productId);
}

function flavorOptionsForProduct(productId: string): Flavor[] {
  const product = selectedProduct(productId);
  const productFlavors = product?.productFlavors ?? [];
  if (productFlavors.length === 0) return activeFlavors.value;
  return productFlavors.map((productFlavor) => productFlavor.flavor).filter((flavor) => flavor.isActive);
}

function lineSubtotal(line: BackfillLine): number {
  const product = selectedProduct(line.productId);
  if (!product) return 0;
  const flavorExtra = flavorOptionsForProduct(line.productId)
    .filter((flavor) => line.flavorIds.includes(flavor.id))
    .reduce((sum, flavor) => sum + flavor.extraPrice, 0);
  return (product.price + flavorExtra) * Math.max(1, Number(line.quantity) || 1);
}

function resetBackfillForm(): void {
  backfillForm.customerName = "現場補單";
  backfillForm.customerPhone = "未提供";
  backfillForm.note = "";
  backfillLines.value = [newBackfillLine()];
  backfillError.value = "";
}

function openBackfillModal(): void {
  resetBackfillForm();
  backfillOpen.value = true;
  if (products.value.length === 0 || flavors.value.length === 0) void loadCatalog();
}

function closeBackfillModal(): void {
  if (savingBackfill.value) return;
  backfillOpen.value = false;
}

function addBackfillLine(): void {
  backfillLines.value.push(newBackfillLine());
}

function removeBackfillLine(localId: string): void {
  if (backfillLines.value.length === 1) return;
  backfillLines.value = backfillLines.value.filter((line) => line.localId !== localId);
}

function resetBackfillLineFlavors(line: BackfillLine): void {
  line.flavorIds = [];
  line.quantity = Math.max(1, Number(line.quantity) || 1);
}

function toggleBackfillFlavor(line: BackfillLine, flavorId: string, event: Event): void {
  const checked = (event.target as HTMLInputElement).checked;
  if (!checked) {
    line.flavorIds = line.flavorIds.filter((id) => id !== flavorId);
    return;
  }
  if (line.flavorIds.length >= 2) {
    (event.target as HTMLInputElement).checked = false;
    backfillError.value = "每個品項最多選擇 2 個口味";
    return;
  }
  line.flavorIds = [...line.flavorIds, flavorId];
  backfillError.value = "";
}

async function loadCatalog(): Promise<void> {
  const [productItems, flavorItems] = await Promise.all([listProducts(), listFlavors()]);
  products.value = productItems;
  flavors.value = flavorItems;
}

async function selectView(mode: OrderViewMode): Promise<void> {
  if (viewMode.value === mode) return;
  viewMode.value = mode;
  await load();
}

async function load(): Promise<void> {
  loading.value = true;
  error.value = "";
  try {
    orders.value = await listOrders({ deleted: viewMode.value, pageSize: 100 });
  } catch {
    error.value = "讀取訂單失敗";
  } finally {
    loading.value = false;
  }
}

async function changeStatus(id: string, status: OrderStatus): Promise<void> {
  loading.value = true;
  error.value = "";
  try {
    await updateOrderStatus(id, status);
    await load();
  } catch {
    error.value = "更新訂單狀態失敗";
    loading.value = false;
  }
}

async function cancel(order: Order): Promise<void> {
  const confirmed = window.confirm(`確定要取消訂單「${order.orderNumber}」？`);
  if (!confirmed) return;
  loading.value = true;
  error.value = "";
  try {
    await cancelOrder(order.id, "管理者取消");
    await load();
  } catch {
    error.value = "取消訂單失敗";
    loading.value = false;
  }
}

async function softDelete(order: Order): Promise<void> {
  const firstConfirmed = window.confirm(`確定要刪除訂單「${order.orderNumber}」？刪除後會先移到已刪除區。`);
  if (!firstConfirmed) return;
  const reason = window.prompt("請輸入刪除原因，可留空。按取消會中止刪除。", "");
  if (reason === null) return;
  const secondConfirmed = window.confirm(`最後確認：要刪除訂單「${order.orderNumber}」嗎？`);
  if (!secondConfirmed) return;
  loading.value = true;
  error.value = "";
  try {
    await deleteOrder(order.id, reason.trim() || undefined);
    await load();
  } catch {
    error.value = "刪除訂單失敗";
    loading.value = false;
  }
}

async function restore(order: Order): Promise<void> {
  const confirmed = window.confirm(`確定要復原訂單「${order.orderNumber}」？`);
  if (!confirmed) return;
  loading.value = true;
  error.value = "";
  try {
    await restoreOrder(order.id);
    await load();
  } catch {
    error.value = "復原訂單失敗";
    loading.value = false;
  }
}

async function submitBackfill(): Promise<void> {
  backfillError.value = "";
  const validLines = backfillLines.value.filter((line) => line.productId && Number(line.quantity) > 0);
  if (!backfillForm.customerName.trim() || !backfillForm.customerPhone.trim()) {
    backfillError.value = "請填寫客戶名稱與電話。";
    return;
  }
  if (validLines.length === 0) {
    backfillError.value = "請至少新增一個商品品項。";
    return;
  }
  savingBackfill.value = true;
  try {
    const order = await createBackfillOrder({
      customerName: backfillForm.customerName.trim(),
      customerPhone: backfillForm.customerPhone.trim(),
      note: backfillForm.note.trim() || undefined,
      items: validLines.map((line) => ({
        productId: line.productId,
        quantity: Math.max(1, Number(line.quantity) || 1),
        flavorIds: line.flavorIds,
        note: line.note.trim() || undefined
      }))
    });
    backfillOpen.value = false;
    message.value = `補單完成：${order.orderNumber}`;
    if (viewMode.value !== "active") viewMode.value = "active";
    await load();
  } catch {
    backfillError.value = "補單失敗，請確認商品、口味與數量。";
  } finally {
    savingBackfill.value = false;
  }
}

onMounted(async () => {
  await Promise.all([load(), loadCatalog()]);
  resetBackfillForm();
});
</script>