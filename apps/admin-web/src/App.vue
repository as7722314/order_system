<template>
  <div class="min-h-screen">
    <aside v-if="auth.isLoggedIn" class="fixed inset-y-0 left-0 hidden w-60 border-r border-stone-200 bg-white p-4 md:block">
      <div class="mb-6 flex items-center justify-between gap-3">
        <h1 class="text-lg font-semibold text-accent">管理後台</h1>
        <AdminNotificationBell />
      </div>
      <nav class="space-y-1 text-sm">
        <RouterLink v-for="link in links" :key="link.to" class="block rounded-md px-3 py-2 hover:bg-stone-100" :to="link.to">{{ link.label }}</RouterLink>
      </nav>
      <AdminInstallButton />
      <button class="mt-4 w-full rounded-md border border-stone-300 py-2" @click="auth.logout()">登出</button>
    </aside>
    <div :class="auth.isLoggedIn ? 'md:pl-60' : ''">
      <RouterView />
    </div>
  </div>
</template>

<script setup lang="ts">
import AdminInstallButton from "./components/AdminInstallButton.vue";
import AdminNotificationBell from "./components/AdminNotificationBell.vue";
import { useAdminAuthStore } from "./stores/adminAuthStore";

const auth = useAdminAuthStore();
const links = [
  { to: "/", label: "儀表板" },
  { to: "/products", label: "商品" },
  { to: "/flavors", label: "口味" },
  { to: "/orders", label: "訂單" },
  { to: "/expenses", label: "成本" },
  { to: "/reports", label: "報表" }
];
</script>
