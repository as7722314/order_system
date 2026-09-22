<template>
  <div class="customer-app min-h-screen text-griddle-800">
    <header class="customer-header">
      <nav class="app-header-inner">
        <RouterLink to="/" class="brand-home">
          <span class="brand-mark">何</span>
          <span>
            <strong>何佳佳蔥油餅</strong>
            <small><i :class="storeStatus?.isOpen ? 'is-open' : ''"></i>{{ storeStatus?.isOpen ? "營業中・現點現煎" : "目前暫停接單" }}</small>
          </span>
        </RouterLink>
        <span v-if="DEV_BYPASS_AUTH" class="preview-badge">預覽</span>
      </nav>
    </header>

    <main v-if="!canBrowse" class="customer-shell">
      <section class="surface-panel notice-panel text-center">
        <h1 class="hero-title">請先登入 LINE</h1>
        <p class="hero-copy">使用 LINE 帳號登入後，即可瀏覽商品、加入購物車與送出訂單。</p>
        <button class="primary-action mt-7" :disabled="loggingIn" @click="login">
          {{ loggingIn ? "登入中..." : "使用 LINE 登入" }}
        </button>
        <p v-if="auth.loginError || error" class="mt-4 text-[24px] font-bold leading-snug text-red-700">{{ auth.loginError || error }}</p>
      </section>
    </main>

    <RouterView v-else />

    <nav v-if="canBrowse" class="bottom-nav" aria-label="主要功能">
      <RouterLink class="bottom-tab" to="/">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3v7a3 3 0 0 0 3 3V3M5 7h3m9-4v18m0-18c-2 1-3 3.2-3 6v3h3" /></svg>
        <span>點餐</span>
      </RouterLink>
      <RouterLink class="bottom-tab" to="/orders">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Zm3 5h6m-6 4h6" /></svg>
        <span>訂單</span>
      </RouterLink>
      <RouterLink class="bottom-tab" to="/cart">
        <span class="bottom-icon-wrap">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2 11h10l2-7H6m3 11a1 1 0 1 0 0 .01M17 19a1 1 0 1 0 0 .01" /></svg>
          <b v-if="cart.items.length" class="cart-count">{{ cart.items.length }}</b>
        </span>
        <span>購物車</span>
      </RouterLink>
    </nav>

    <div v-if="authExpiredOpen" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 px-4 py-6">
      <section class="w-full max-w-md rounded-2xl border-4 border-brand-100 bg-white p-6 text-center shadow-2xl">
        <h2 class="hero-title">登入已過期</h2>
        <p class="hero-copy">系統偵測到登入狀態失效，請重新使用 LINE 登入後繼續點餐。</p>
        <button class="primary-action mt-7" :disabled="reauthenticating" type="button" @click="relogin">
          {{ reauthenticating ? "登入中..." : "重新登入" }}
        </button>
        <p v-if="auth.loginError || error" class="mt-4 text-[24px] font-bold leading-snug text-red-700">{{ auth.loginError || error }}</p>
      </section>
    </div>

    <div v-if="storeStatus && !storeStatus.isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6">
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
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { fetchStoreStatus } from "./api/client";
import { DEV_BYPASS_AUTH } from "./config/environment";
import { useAuthStore } from "./stores/authStore";
import { useCartStore } from "./stores/cartStore";
import type { StoreStatus } from "./types/order";

const cart = useCartStore();
const auth = useAuthStore();
const canBrowse = computed(() => Boolean(auth.token) || DEV_BYPASS_AUTH);
const loggingIn = ref(false);
const error = ref("");
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
  if (DEV_BYPASS_AUTH) return;
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
  window.addEventListener("store-status-closed", handleStoreClosed);
  window.addEventListener("customer-auth-expired", handleAuthExpired);
  void loadStoreStatus();
  storeStatusTimer = window.setInterval(() => void loadStoreStatus(), 10000);
  if (!canBrowse.value) void login();
});

onBeforeUnmount(() => {
  if (storeStatusTimer) window.clearInterval(storeStatusTimer);
  window.removeEventListener("store-status-closed", handleStoreClosed);
  window.removeEventListener("customer-auth-expired", handleAuthExpired);
});
</script>
