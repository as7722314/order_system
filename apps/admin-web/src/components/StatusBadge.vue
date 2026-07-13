<template>
  <span class="rounded-full px-2 py-1 text-xs font-semibold" :class="classes">{{ label }}</span>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { OrderStatus } from "../types/admin";

const props = defineProps<{ status: OrderStatus | Lowercase<OrderStatus> | string }>();

const labels: Record<OrderStatus, string> = {
  PENDING: "待接單",
  CONFIRMED: "製作中",
  PREPARING: "製作中",
  READY: "可取餐",
  COMPLETED: "已完成",
  CANCELLED: "已取消"
};

const normalized = computed(() => props.status.toUpperCase() as OrderStatus);
const label = computed(() => labels[normalized.value] ?? props.status);
const classes = computed(() => {
  if (normalized.value === "CANCELLED") return "bg-red-100 text-red-700";
  if (normalized.value === "COMPLETED") return "bg-emerald-100 text-emerald-700";
  if (normalized.value === "READY") return "bg-sky-100 text-sky-700";
  return "bg-amber-100 text-amber-800";
});
</script>

