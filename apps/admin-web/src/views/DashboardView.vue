<template>
  <main class="p-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold">儀表板</h1>
        <p class="mt-1 text-sm text-stone-500">{{ today }} 營運狀態</p>
      </div>
      <button class="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium" :disabled="loading" @click="load">
        {{ loading ? "讀取中" : "重新整理" }}
      </button>
    </div>

    <div class="mt-5 grid gap-4 md:grid-cols-4">
      <section v-for="card in cards" :key="card.label" class="rounded-lg border border-stone-200 bg-white p-5">
        <p class="text-sm text-stone-500">{{ card.label }}</p>
        <p class="mt-2 text-2xl font-semibold">{{ card.value }}</p>
      </section>
    </div>

    <p v-if="error" class="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>

    <section class="mt-6">
      <div class="mb-3 flex items-center justify-between gap-4">
        <h2 class="text-lg font-semibold">待接單明細</h2>
        <span class="text-sm text-stone-500">{{ pendingOrders.length }} 筆</span>
      </div>
      <OrderDetailList interactive :disabled="loading" :orders="pendingOrders" empty-text="目前沒有待接單訂單" @cancel="cancel" @change-status="changeStatus" />
    </section>

    <section class="mt-8">
      <div class="mb-3 flex items-center justify-between gap-4">
        <h2 class="text-lg font-semibold">今日訂單明細</h2>
        <span class="text-sm text-stone-500">{{ todayOrders.length }} 筆</span>
      </div>
      <OrderDetailList :orders="todayOrders" empty-text="今天尚無訂單" />
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, ref } from "vue";
import { cancelOrder, dailyReport, listOrders, updateOrderStatus } from "../api/client";
import StatusBadge from "../components/StatusBadge.vue";
import type { Order, OrderItem, OrderStatus } from "../types/admin";
import { canCancel, normalizeStatus, statusActions } from "../utils/orderStatusActions";

const formatter = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Taipei",
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

const timeFormatter = new Intl.DateTimeFormat("zh-TW", {
  timeZone: "Asia/Taipei",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false
});

const today = formatter.format(new Date());
const todayOrders = ref<Order[]>([]);
const pendingOrders = ref<Order[]>([]);
const report = ref({ orderCount: 0, totalRevenue: 0, totalExpense: 0, netProfit: 0 });
const loading = ref(false);
const error = ref("");

const cards = computed(() => [
  { label: "今日訂單數", value: String(report.value.orderCount) },
  { label: "待接單數", value: String(pendingOrders.value.length) },
  { label: "今日營收", value: money(report.value.totalRevenue) },
  { label: "今日淨利", value: money(report.value.netProfit) }
]);

function money(amount: number): string {
  return `NT$ ${amount.toLocaleString("zh-TW")}`;
}

function formatTime(value: string): string {
  return timeFormatter.format(new Date(value));
}

function flavorText(item: OrderItem): string {
  if (!item.flavors.length) return "未選口味";
  return item.flavors.map((flavor) => flavor.flavorNameSnapshot).join("、");
}

async function load(): Promise<void> {
  loading.value = true;
  error.value = "";
  try {
    const [daily, todayItems, pendingItems] = await Promise.all([
      dailyReport(today),
      listOrders({ date: today, pageSize: 100 }),
      listOrders({ status: "PENDING", pageSize: 100 })
    ]);
    report.value = daily;
    todayOrders.value = todayItems;
    pendingOrders.value = pendingItems;
  } catch {
    error.value = "讀取儀表板資料失敗";
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

const OrderDetailList = defineComponent({
  name: "OrderDetailList",
  props: {
    orders: { type: Array as () => Order[], required: true },
    emptyText: { type: String, required: true },
    disabled: { type: Boolean, default: false },
    interactive: { type: Boolean, default: false }
  },
  emits: {
    changeStatus: (_id: string, _status: OrderStatus) => true,
    cancel: (_order: Order) => true
  },
  setup(props, { emit }) {
    return () => {
      if (props.orders.length === 0) {
        return h("div", { class: "rounded-lg border border-dashed border-stone-300 bg-white p-6 text-center text-sm text-stone-500" }, props.emptyText);
      }

      return h("div", { class: "grid gap-3" }, props.orders.map((order) => {
        const actions = statusActions(order.status);
        const cancelable = canCancel(order.status);
        return h("article", {
          key: order.id,
          class: "rounded-lg border border-stone-200 bg-white p-4 shadow-sm"
        }, [
          h("div", { class: "flex flex-wrap items-start justify-between gap-3" }, [
            h("div", [
              h("div", { class: "flex flex-wrap items-center gap-2" }, [
                h("span", { class: "text-base font-semibold text-stone-900" }, order.orderNumber),
                h(StatusBadge, { status: normalizeStatus(order.status) })
              ]),
              h("p", { class: "mt-1 text-sm text-stone-500" }, `${formatTime(order.createdAt)} / ${order.customerName} / ${order.customerPhone}`)
            ]),
            h("p", { class: "text-lg font-semibold text-stone-900" }, money(order.totalAmount))
          ]),
          h("div", { class: "mt-3 divide-y divide-stone-100 rounded-md bg-stone-50" }, (order.items ?? []).map((item) => h("div", {
            key: item.id,
            class: "p-3"
          }, [
            h("div", { class: "flex flex-wrap items-center justify-between gap-2" }, [
              h("p", { class: "font-medium text-stone-900" }, `${item.productNameSnapshot} x ${item.quantity}`),
              h("p", { class: "text-sm font-medium text-stone-700" }, money(item.subtotal))
            ]),
            h("p", { class: "mt-1 text-sm text-stone-600" }, `口味：${flavorText(item)}`),
            item.note ? h("p", { class: "mt-1 text-sm text-amber-700" }, `品項備註：${item.note}`) : null
          ]))),
          order.note ? h("p", { class: "mt-3 rounded-md bg-amber-50 p-2 text-sm text-amber-800" }, `訂單備註：${order.note}`) : null,
          props.interactive ? h("div", { class: "mt-4 flex flex-wrap justify-end gap-2" }, [
            ...actions.map((action) => h("button", {
              key: action.status,
              class: `rounded-md px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${action.className}`,
              disabled: props.disabled,
              onClick: () => emit("changeStatus", order.id, action.status)
            }, action.label)),
            cancelable ? h("button", {
              class: "rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50",
              disabled: props.disabled,
              onClick: () => emit("cancel", order)
            }, "取消") : null,
            actions.length === 0 && !cancelable ? h("span", { class: "px-2 py-2 text-xs text-stone-500" }, "無可用操作") : null
          ]) : null
        ]);
      }));
    };
  }
});

onMounted(load);
</script>
