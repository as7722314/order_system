<template>
  <div class="admin-app">
    <header v-if="auth.isLoggedIn && !isDesktop" class="admin-mobile-header">
      <button ref="menuButton" class="admin-icon-button" aria-label="開啟選單" aria-controls="admin-mobile-navigation" :aria-expanded="mobileMenuOpen" type="button" @click="mobileMenuOpen = true"><AdminIcon name="menu" /></button>
      <RouterLink to="/" class="admin-brand"><span class="admin-brand-mark">何</span><span><strong>何佳佳蔥油餅</strong><small>門市管理後台</small></span></RouterLink>
      <AdminNotificationBell />
    </header>

    <aside v-if="auth.isLoggedIn" class="admin-sidebar" aria-label="管理後台導覽">
      <RouterLink to="/" class="admin-brand"><span class="admin-brand-mark">何</span><span><strong>何佳佳蔥油餅</strong><small>門市管理後台</small></span></RouterLink>
      <p class="admin-nav-caption">日常營運</p>
      <nav class="admin-nav" aria-label="主要功能">
        <RouterLink v-for="link in links" :key="link.to" :to="link.to" class="admin-nav-link"><AdminIcon :name="link.icon" /><span>{{ link.label }}</span><i class="nav-indicator" aria-hidden="true"></i></RouterLink>
      </nav>
      <div class="admin-sidebar-bottom">
        <div class="admin-sidebar-note"><AdminIcon name="store" /><span>每一份好滋味<br />從用心經營開始</span></div>
        <AdminInstallButton />
        <button class="admin-logout" type="button" @click="logout"><AdminIcon name="logout" />登出帳號</button>
      </div>
    </aside>

    <div v-if="auth.isLoggedIn && mobileMenuOpen" class="admin-drawer-backdrop">
      <button class="absolute inset-0" aria-label="關閉選單背景" type="button" @click="mobileMenuOpen = false"></button>
      <aside id="admin-mobile-navigation" class="admin-drawer relative" role="dialog" aria-modal="true" aria-label="功能選單" @keydown.esc.stop="mobileMenuOpen = false" @keydown.tab="trapDrawerFocus">
        <div class="admin-drawer-heading">
          <div class="admin-brand"><span class="admin-brand-mark">何</span><span><strong>何佳佳蔥油餅</strong><small>門市管理後台</small></span></div>
          <button ref="drawerCloseButton" class="admin-icon-button" aria-label="關閉選單" type="button" @click="mobileMenuOpen = false"><AdminIcon name="close" /></button>
        </div>
        <p class="admin-nav-caption">日常營運</p>
        <nav class="admin-nav" aria-label="手機主要功能">
          <RouterLink v-for="link in links" :key="link.to" :to="link.to" class="admin-nav-link" @click="mobileMenuOpen = false"><AdminIcon :name="link.icon" /><span>{{ link.label }}</span><i class="nav-indicator" aria-hidden="true"></i></RouterLink>
        </nav>
        <div class="admin-sidebar-bottom"><AdminInstallButton /><button class="admin-logout" type="button" @click="logout"><AdminIcon name="logout" />登出帳號</button></div>
      </aside>
    </div>

    <div class="admin-content" :class="{ 'is-authenticated': auth.isLoggedIn }">
      <header v-if="auth.isLoggedIn && isDesktop" class="admin-topbar">
        <div class="admin-breadcrumb"><span>門市工作台</span><AdminIcon name="chevron" /><strong>{{ activePage }}</strong></div>
        <div class="admin-topbar-right"><span class="admin-date">{{ dateLabel }}</span><AdminNotificationBell /></div>
      </header>
      <RouterView />
    </div>
    <AdminFeedback />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import AdminInstallButton from "./components/AdminInstallButton.vue";
import AdminNotificationBell from "./components/AdminNotificationBell.vue";
import { useAdminAuthStore } from "./stores/adminAuthStore";

import AdminIcon from "./components/AdminIcon.vue";
import AdminFeedback from "./components/AdminFeedback.vue";
import { useAdminFeedback } from "./composables/useAdminFeedback";

const auth = useAdminAuthStore();
const router = useRouter();
const route = useRoute();
const feedback = useAdminFeedback();
watch(() => auth.isLoggedIn, (loggedIn) => { if (!loggedIn) feedback.clear(); });
const menuButton = ref<HTMLButtonElement | null>(null);
const drawerCloseButton = ref<HTMLButtonElement | null>(null);
const mobileMenuOpen = ref(false);
const isDesktop = ref(window.matchMedia("(min-width: 768px)").matches);
let desktopMediaQuery: MediaQueryList | null = null;
const links = [
  { to: "/", label: "儀表板", icon: "dashboard" },
  { to: "/products", label: "商品", icon: "products" },
  { to: "/flavors", label: "口味", icon: "flavors" },
  { to: "/orders", label: "訂單", icon: "orders" },
  { to: "/expenses", label: "成本", icon: "expenses" },
  { to: "/reports", label: "報表", icon: "reports" }
];

const activePage = computed(() => links.find((link) => link.to === route.path)?.label ?? "門市工作台");
const dateLabel = new Intl.DateTimeFormat("zh-TW", { timeZone: "Asia/Taipei", month: "long", day: "numeric", weekday: "long" }).format(new Date());
watch(mobileMenuOpen, async (opened) => {
  await nextTick();
  if (opened) drawerCloseButton.value?.focus();
  else menuButton.value?.focus();
});

function trapDrawerFocus(event: KeyboardEvent): void {
  const drawer = event.currentTarget as HTMLElement;
  const controls = [...drawer.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')];
  const first = controls[0];
  const last = controls.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
}

function updateDesktopState(event?: MediaQueryListEvent): void {
  isDesktop.value = event?.matches ?? desktopMediaQuery?.matches ?? false;
  if (isDesktop.value) mobileMenuOpen.value = false;
}

function logout(): void {
  mobileMenuOpen.value = false;
  auth.logout();
  void router.push("/login");
}

function handleAuthExpired(): void {
  mobileMenuOpen.value = false;
  auth.logout();
  void router.replace({ path: "/login", query: { reason: "expired" } });
}

onMounted(() => {
  desktopMediaQuery = window.matchMedia("(min-width: 768px)");
  updateDesktopState();
  desktopMediaQuery.addEventListener("change", updateDesktopState);
  window.addEventListener("admin-auth-expired", handleAuthExpired);
});

onBeforeUnmount(() => {
  feedback.clear();
  desktopMediaQuery?.removeEventListener("change", updateDesktopState);
  window.removeEventListener("admin-auth-expired", handleAuthExpired);
});
</script>
