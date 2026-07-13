<template>
  <div ref="rootEl" class="relative">
    <button
      class="relative grid h-10 w-10 place-items-center rounded-full border border-stone-200 bg-white text-stone-700 shadow-sm hover:bg-stone-50"
      title="新訂單通知"
      type="button"
      @click="toggleOpen"
    >
      <svg aria-hidden="true" class="h-5 w-5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24">
        <path d="M10.27 21a2 2 0 0 0 3.46 0" />
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      </svg>
      <span v-if="unreadCount > 0" class="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-600 px-1.5 py-0.5 text-xs font-semibold leading-none text-white">
        {{ unreadCount > 99 ? "99+" : unreadCount }}
      </span>
      <span class="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-white" :class="connected ? 'bg-emerald-500' : 'bg-stone-400'"></span>
    </button>

    <div v-if="open" class="absolute left-full top-0 z-20 ml-2 w-80 rounded-lg border border-stone-200 bg-white shadow-lg">
      <div class="flex items-center justify-between border-b border-stone-100 px-4 py-3">
        <div>
          <p class="font-semibold text-stone-900">新訂單通知</p>
          <p class="text-xs" :class="connected ? 'text-emerald-700' : 'text-stone-500'">{{ connected ? "即時連線中" : "連線中斷，稍後會自動重連" }}</p>
        </div>
        <div class="flex items-center gap-2">
          <button class="text-xs font-medium text-stone-500 hover:text-stone-900" type="button" @click="clearNotifications">清除</button>
          <button class="rounded-full p-1 text-stone-500 hover:bg-stone-100 hover:text-stone-900" title="關閉通知" type="button" @click="closeDropdown">
            <svg aria-hidden="true" class="h-4 w-4" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div class="flex items-center justify-between border-b border-stone-100 px-4 py-2 text-sm">
        <span class="text-stone-600">通知音效</span>
        <button class="rounded-full px-3 py-1 text-xs font-semibold" :class="soundEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-500'" type="button" @click="toggleSound">
          {{ soundEnabled ? "已開啟" : "已關閉" }}
        </button>
      </div>

      <div v-if="notifications.length === 0" class="p-4 text-sm text-stone-500">目前沒有新訂單通知</div>
      <div v-else class="max-h-96 divide-y divide-stone-100 overflow-auto">
        <article v-for="item in notifications" :key="item.id" class="p-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="font-semibold text-stone-900">{{ item.orderNumber }}</p>
              <p class="mt-1 text-sm text-stone-600">{{ item.customerName }} / {{ item.customerPhone }}</p>
              <p class="mt-1 text-xs text-stone-500">{{ formatTime(item.createdAt) }}</p>
            </div>
            <p class="whitespace-nowrap text-sm font-semibold text-stone-900">NT$ {{ item.totalAmount }}</p>
          </div>
        </article>
      </div>

      <RouterLink class="block border-t border-stone-100 px-4 py-3 text-center text-sm font-medium text-accent hover:bg-stone-50" to="/orders" @click="closePanel">
        查看訂單
      </RouterLink>
    </div>

    <div v-if="modalOrder" class="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4">
      <section class="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-red-600">新訂單</p>
            <h2 class="mt-1 text-xl font-semibold text-stone-900">有新的訂單進來了</h2>
          </div>
          <button class="rounded-full p-2 text-stone-500 hover:bg-stone-100" title="關閉" type="button" @click="closeModal">
            <svg aria-hidden="true" class="h-5 w-5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <div class="mt-4 rounded-md bg-stone-50 p-4 text-sm text-stone-700">
          <p class="font-semibold text-stone-900">{{ modalOrder.orderNumber }}</p>
          <p class="mt-2">客戶：{{ modalOrder.customerName }}</p>
          <p class="mt-1">電話：{{ modalOrder.customerPhone }}</p>
          <p class="mt-1">時間：{{ formatTime(modalOrder.createdAt) }}</p>
          <p class="mt-1 text-base font-semibold text-stone-900">金額：NT$ {{ modalOrder.totalAmount }}</p>
        </div>

        <div class="mt-5 flex justify-end gap-2">
          <button class="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium" type="button" @click="closeModal">稍後處理</button>
          <RouterLink class="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white" to="/orders" @click="acknowledgeOrder">查看訂單</RouterLink>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useAdminAuthStore } from "../stores/adminAuthStore";

type NewOrderEvent = {
  type: "new-order";
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  createdAt: string;
};

type NotificationItem = NewOrderEvent & {
  id: string;
};

const auth = useAdminAuthStore();
const rootEl = ref<HTMLElement | null>(null);
const open = ref(false);
const connected = ref(false);
const unreadCount = ref(0);
const notifications = ref<NotificationItem[]>([]);
const modalOrder = ref<NotificationItem | null>(null);
const soundEnabled = ref(localStorage.getItem("admin_notification_sound") !== "false");
let source: EventSource | null = null;
let audioContext: AudioContext | null = null;

const token = computed(() => auth.token);

function buildEventUrl(value: string): string {
  const base = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(/\/$/, "");
  return `${base}/admin/order-events?token=${encodeURIComponent(value)}`;
}

function connect(value: string | null): void {
  disconnect();
  if (!value) return;

  source = new EventSource(buildEventUrl(value));
  source.addEventListener("connected", () => {
    connected.value = true;
  });
  source.addEventListener("new-order", (event) => {
    const payload = JSON.parse(event.data) as NewOrderEvent;
    const item = { ...payload, id: `${payload.orderNumber}-${Date.now()}` };
    notifications.value = [item, ...notifications.value].slice(0, 20);
    unreadCount.value += 1;
    modalOrder.value = item;
    void playNotificationSound();
  });
  source.onerror = () => {
    connected.value = false;
  };
}

function disconnect(): void {
  connected.value = false;
  if (source) {
    source.close();
    source = null;
  }
}

function toggleOpen(): void {
  open.value = !open.value;
  if (open.value) markRead();
}

function markRead(): void {
  unreadCount.value = 0;
}

function closePanel(): void {
  unreadCount.value = 0;
  open.value = false;
}

function closeDropdown(): void {
  open.value = false;
}

function closeModal(): void {
  modalOrder.value = null;
}

function acknowledgeOrder(): void {
  modalOrder.value = null;
  unreadCount.value = 0;
  open.value = false;
}

function clearNotifications(): void {
  notifications.value = [];
  unreadCount.value = 0;
}

function toggleSound(): void {
  soundEnabled.value = !soundEnabled.value;
  localStorage.setItem("admin_notification_sound", String(soundEnabled.value));
  if (soundEnabled.value) unlockAudio();
}

function getAudioContext(): AudioContext {
  audioContext ??= new AudioContext();
  return audioContext;
}

function unlockAudio(): void {
  if (!soundEnabled.value) return;
  void getAudioContext().resume().catch(() => undefined);
  document.removeEventListener("pointerdown", unlockAudio);
}

async function playNotificationSound(): Promise<void> {
  if (!soundEnabled.value) return;
  try {
    const context = getAudioContext();
    if (context.state === "suspended") await context.resume();
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, now);
    oscillator.frequency.setValueAtTime(1175, now + 0.12);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.28, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.4);
  } catch {
    // Browsers can block audio until the user interacts with the page.
  }
}

function handleDocumentPointerDown(event: PointerEvent): void {
  if (!open.value) return;
  const target = event.target;
  if (target instanceof Node && rootEl.value?.contains(target)) return;
  closeDropdown();
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === "Escape") closeDropdown();
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(value));
}

watch(token, connect, { immediate: true });
onMounted(() => {
  document.addEventListener("pointerdown", unlockAudio, { once: true });
  document.addEventListener("pointerdown", handleDocumentPointerDown);
  document.addEventListener("keydown", handleKeydown);
});
onBeforeUnmount(() => {
  disconnect();
  document.removeEventListener("pointerdown", unlockAudio);
  document.removeEventListener("pointerdown", handleDocumentPointerDown);
  document.removeEventListener("keydown", handleKeydown);
  if (audioContext) void audioContext.close().catch(() => undefined);
});
</script>
