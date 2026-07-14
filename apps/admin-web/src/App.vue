<template>
  <div class="min-h-screen">
    <header v-if="auth.isLoggedIn && !isDesktop" class="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-stone-200 bg-white px-4 md:hidden">
      <button class="rounded-md border border-stone-300 p-2 text-stone-700" title="開啟選單" type="button" @click="mobileMenuOpen = true">
        <svg aria-hidden="true" class="h-5 w-5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24">
          <path d="M4 6h16" />
          <path d="M4 12h16" />
          <path d="M4 18h16" />
        </svg>
      </button>
      <h1 class="text-base font-semibold text-accent">管理後台</h1>
      <AdminNotificationBell />
    </header>

    <aside v-if="auth.isLoggedIn" class="fixed inset-y-0 left-0 hidden w-60 border-r border-stone-200 bg-white p-4 md:block">
      <div class="mb-6 flex items-center justify-between gap-3">
        <h1 class="text-lg font-semibold text-accent">管理後台</h1>
        <AdminNotificationBell v-if="isDesktop" />
      </div>
      <nav class="space-y-1 text-sm">
        <RouterLink v-for="link in links" :key="link.to" class="block rounded-md px-3 py-2 hover:bg-stone-100" :to="link.to">{{ link.label }}</RouterLink>
      </nav>
      <AdminInstallButton />
      <button class="mt-4 w-full rounded-md border border-stone-300 py-2" @click="logout">登出</button>
    </aside>

    <div v-if="auth.isLoggedIn && mobileMenuOpen" class="fixed inset-0 z-50 md:hidden">
      <button class="absolute inset-0 bg-black/40" title="關閉選單" type="button" @click="mobileMenuOpen = false"></button>
      <aside class="relative z-10 h-full w-72 max-w-[85vw] border-r border-stone-200 bg-white p-4 shadow-xl">
        <div class="mb-6 flex items-center justify-between gap-3">
          <h2 class="text-lg font-semibold text-accent">管理後台</h2>
          <button class="rounded-full p-2 text-stone-500 hover:bg-stone-100" title="關閉選單" type="button" @click="mobileMenuOpen = false">
            <svg aria-hidden="true" class="h-5 w-5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
        <nav class="space-y-1 text-base">
          <RouterLink v-for="link in links" :key="link.to" class="block rounded-md px-3 py-3 hover:bg-stone-100" :to="link.to" @click="mobileMenuOpen = false">{{ link.label }}</RouterLink>
        </nav>
        <AdminInstallButton />
        <button class="mt-4 w-full rounded-md border border-stone-300 py-3" @click="logout">登出</button>
      </aside>
    </div>

    <div :class="auth.isLoggedIn ? 'pt-14 md:pl-60 md:pt-0' : ''">
      <RouterView />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import AdminInstallButton from "./components/AdminInstallButton.vue";
import AdminNotificationBell from "./components/AdminNotificationBell.vue";
import { useAdminAuthStore } from "./stores/adminAuthStore";

const auth = useAdminAuthStore();
const router = useRouter();
const mobileMenuOpen = ref(false);
const isDesktop = ref(window.matchMedia("(min-width: 768px)").matches);
let desktopMediaQuery: MediaQueryList | null = null;
const links = [
  { to: "/", label: "儀表板" },
  { to: "/products", label: "商品" },
  { to: "/flavors", label: "口味" },
  { to: "/orders", label: "訂單" },
  { to: "/expenses", label: "成本" },
  { to: "/reports", label: "報表" }
];

function updateDesktopState(event?: MediaQueryListEvent): void {
  isDesktop.value = event?.matches ?? desktopMediaQuery?.matches ?? false;
  if (isDesktop.value) mobileMenuOpen.value = false;
}

function logout(): void {
  mobileMenuOpen.value = false;
  auth.logout();
  void router.push("/login");
}

onMounted(() => {
  desktopMediaQuery = window.matchMedia("(min-width: 768px)");
  updateDesktopState();
  desktopMediaQuery.addEventListener("change", updateDesktopState);
});

onBeforeUnmount(() => {
  desktopMediaQuery?.removeEventListener("change", updateDesktopState);
});
</script>
