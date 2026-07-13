<template>
  <div class="min-h-screen pb-5 text-griddle-800">
    <header class="sticky top-0 z-20 border-b-4 border-brand-100 bg-brand-50/95 shadow-lg backdrop-blur">
      <nav class="w-full px-2 py-2">
        <RouterLink to="/" class="block rounded-lg bg-white/80 py-2 text-center text-[42px] font-black leading-tight text-brand-700 shadow-sm ring-1 ring-brand-100">蔥油餅點餐</RouterLink>
        <div v-if="auth.token && lineBrowserAllowed" class="mt-2 grid grid-cols-3 gap-2 text-center text-[30px] font-black leading-tight">
          <RouterLink class="top-tab rounded-lg bg-white px-2 py-4 text-griddle-800 shadow-sm ring-1 ring-brand-100" to="/">點餐</RouterLink>
          <RouterLink class="top-tab rounded-lg bg-white px-2 py-4 text-griddle-800 shadow-sm ring-1 ring-brand-100" to="/orders">訂單</RouterLink>
          <RouterLink class="top-tab rounded-lg bg-white px-2 py-4 text-griddle-800 shadow-sm ring-1 ring-brand-100" to="/cart">購物車 {{ cart.items.length }}</RouterLink>
        </div>
      </nav>
    </header>

    <main v-if="!lineBrowserAllowed" class="w-full px-2 py-3">
      <section class="rounded-lg border-4 border-brand-100 bg-white/95 p-4 text-center shadow-lg">
        <h1 class="text-[48px] font-black leading-tight text-brand-700">請從 LINE 開啟</h1>
        <p class="mt-5 text-[30px] font-bold leading-[1.45] text-griddle-800">點餐頁面僅開放在官方 LINE 內建瀏覽器使用。請回到官方 LINE，從選單或連結重新進入。</p>
      </section>
    </main>

    <main v-else-if="!auth.token" class="w-full px-2 py-3">
      <section class="rounded-lg border-4 border-brand-100 bg-white/95 p-4 text-center shadow-lg">
        <h1 class="text-[48px] font-black leading-tight text-brand-700">請先登入 LINE</h1>
        <p class="mt-5 text-[30px] font-bold leading-[1.45] text-griddle-800">登入後即可瀏覽商品、加入購物車與送出訂單。</p>
        <button class="mt-7 w-full rounded-lg bg-scallion-600 py-5 text-[34px] font-black leading-tight text-white shadow-lg" :disabled="loggingIn" @click="login">
          {{ loggingIn ? "登入中..." : "使用 LINE 登入" }}
        </button>
        <p v-if="auth.loginError || error" class="mt-4 text-[26px] font-bold leading-snug text-red-700">{{ auth.loginError || error }}</p>
      </section>
    </main>

    <RouterView v-else />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useAuthStore } from "./stores/authStore";
import { useCartStore } from "./stores/cartStore";

const cart = useCartStore();
const auth = useAuthStore();
const loggingIn = ref(false);
const error = ref("");
const lineBrowserAllowed = ref(/Line\//i.test(window.navigator.userAgent));

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
  if (!auth.token) void login();
});
</script>
