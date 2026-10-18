<template>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path v-for="(path, index) in paths" :key="index" :d="path" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{ name: string }>();
const icons: Record<string, string[]> = {
  dashboard: ["M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"],
  orders: ["M6 3h12v18l-3-2-3 2-3-2-3 2V3Z", "M9 8h6M9 12h4"],
  products: ["m3 7 9-4 9 4-9 4-9-4ZM3 7v10l9 4 9-4V7M12 11v10", "m8 5 9 4"],
  flavors: ["M12 3c-2 4-7 8-7 12a7 7 0 0 0 14 0c0-4-5-8-7-12Z", "M9 16a3 3 0 0 0 3 3"],
  expenses: ["M4 6h16v14H4zM4 6V4h13v2M16 12h5v5h-5a2.5 2.5 0 0 1 0-5Z", "M16.5 14.5h.01"],
  reports: ["M4 3h16v18H4zM8 16v-3M12 16V8M16 16v-5"],
  store: ["M3 9h18l-2-6H5L3 9ZM3 9v2a3 3 0 0 0 6 0V9m0 0v2a3 3 0 0 0 6 0V9m0 0v2a3 3 0 0 0 6 0V9", "M5 14v7h14v-7M9 21v-5h6v5"],
  clock: ["M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 7v5l3 2"],
  revenue: ["M3 6h18v12H3zM7 10h.01M17 14h.01M14.5 12a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z"],
  refresh: ["M20 7v5h-5M4 17v-5h5", "M6 7a7 7 0 0 1 11-1l3 3M4 15l3 3a7 7 0 0 0 11-1"],
  logout: ["M9 4H4v16h5M14 8l4 4-4 4M8 12h12"],
  menu: ["M4 6h16M4 12h16M4 18h16"],
  close: ["m6 6 12 12M18 6 6 18"],
  chevron: ["m9 5 7 7-7 7"]
};
const paths = computed(() => icons[props.name] ?? icons.dashboard);
</script>
