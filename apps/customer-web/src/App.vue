<template>
  <div class="min-h-screen pb-5 text-griddle-800">
    <header class="customer-header">
      <nav class="w-full px-3 py-3">
        <RouterLink to="/" class="brand-pill">何佳佳蔥油餅</RouterLink>
        <div v-if="auth.token && lineBrowserAllowed" class="mt-3 grid grid-cols-3 gap-2 text-center">
          <RouterLink class="top-tab" to="/">點餐</RouterLink>
          <RouterLink class="top-tab" to="/orders">訂單</RouterLink>
          <RouterLink class="top-tab" to="/cart">購物車 {{ cart.items.length }}</RouterLink>
        </div>
      </nav>
    </header>

    <main v-if="!lineBrowserAllowed" class="customer-shell">
      <section class="surface-panel text-center">
        <h1 class="hero-title">請從 LINE 開啟</h1>
        <p class="hero-copy">點餐頁面僅開放在官方 LINE 內建瀏覽器使用。請回到官方 LINE，從選單或連結重新進入。</p>
      </section>
    </main>

    <main v-else-if="!auth.token" class="customer-shell">
      <section class="surface-panel text-center">
        <h1 class="hero-title">請先登入 LINE</h1>
        <p class="hero-copy">登入後即可瀏覽商品、加入購物車與送出訂單。</p>
        <button class="primary-action mt-7" :disabled="loggingIn" @click="login">
          {{ loggingIn ? "登入中..." : "使用 LINE 登入" }}
        </button>
        <p v-if="auth.loginError || error" class="mt-4 text-[24px] font-bold leading-snug text-red-700">{{ auth.loginError || error }}</p>
      </section>
    </main>

    <RouterView v-else />

    <div v-if="lineBrowserAllowed && authExpiredOpen" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 px-4 py-6">
      <section class="w-full max-w-md rounded-2xl border-4 border-brand-100 bg-white p-6 text-center shadow-2xl">
        <h2 class="hero-title">登入已過期</h2>
        <p class="hero-copy">系統偵測到登入狀態失效，請重新使用 LINE 登入後繼續點餐。</p>
        <button class="primary-action mt-7" :disabled="reauthenticating" type="button" @click="relogin">
          {{ reauthenticating ? "登入中..." : "重新登入" }}
        </button>
        <p v-if="auth.loginError || error" class="mt-4 text-[24px] font-bold leading-snug text-red-700">{{ auth.loginError || error }}</p>
      </section>
    </div>

    <div v-if="lineBrowserAllowed && storeStatus && !storeStatus.isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6">
      <section class="w-full max-w-md rounded-2xl border-4 border-brand-100 bg-white p-6 text-center shadow-2xl">
        <h2 class="hero-title">目前非營業時間</h2>
        <p class="hero-copy">現在暫停線上點餐，恢復營業後此提示會自動關閉。</p>
        <button class="primary-action mt-7" :disabled="checkingStoreStatus" type="button" @click="loadStoreStatus">
          {{ checkingStoreStatus ? "檢查中..." : "重新檢查" }}
        </button>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { fetchStoreStatus } from "./api/client";
import { useAuthStore } from "./stores/authStore";
import { useCartStore } from "./stores/cartStore";
import type { StoreStatus } from "./types/order";

const cart = useCartStore();
const auth = useAuthStore();
const loggingIn = ref(false);
const error = ref("");
const lineBrowserAllowed = ref(/Line\//i.test(window.navigator.userAgent));
const storeStatus = ref<StoreStatus | null>(null);
const checkingStoreStatus = ref(false);
const authExpiredOpen = ref(false);
const reauthenticating = ref(false);
let storeStatusTimer: number | undefined;

async function loadStoreStatus(): Promise<void> {
  if (checkingStoreStatus.value) return;
  checkingStoreStatus.value = true;
  try {
    storeStatus.value = await fetchStoreStatus();
  } catch {
    storeStatus.value = { isOpen: false, updatedAt: new Date().toISOString() };
  } finally {
    checkingStoreStatus.value = false;
  }
}

function handleStoreClosed(event: Event): void {
  storeStatus.value = (event as CustomEvent<StoreStatus>).detail ?? { isOpen: false, updatedAt: new Date().toISOString() };
}

function handleAuthExpired(): void {
  auth.logout();
  authExpiredOpen.value = true;
  error.value = "";
}

async function relogin(): Promise<void> {
  if (reauthenticating.value) return;
  reauthenticating.value = true;
  error.value = "";
  try {
    auth.logout();
    await auth.loginWithLine();
    authExpiredOpen.value = false;
  } catch {
    error.value = auth.loginError || "LINE 重新登入失敗";
  } finally {
    reauthenticating.value = false;
  }
}

async function login(): Promise<void> {
  if (loggingIn.value) return;
  loggingIn.value = true;
  error.value = "";
  try {
    await auth.loginWithLine();
  } catch {
    error.value = auth.loginError || "LINE 登入失敗";
  } finally {
    loggingIn.value = false;
  }
}

onMounted(() => {
  if (!lineBrowserAllowed.value) {
    auth.logout();
    return;
  }
  window.addEventListener("store-status-closed", handleStoreClosed);
  window.addEventListener("customer-auth-expired", handleAuthExpired);
  void loadStoreStatus();
  storeStatusTimer = window.setInterval(() => void loadStoreStatus(), 10000);
  if (!auth.token) void login();
});

onBeforeUnmount(() => {
  if (storeStatusTimer) window.clearInterval(storeStatusTimer);
  window.removeEventListener("store-status-closed", handleStoreClosed);
  window.removeEventListener("customer-auth-expired", handleAuthExpired);
});
</script>
