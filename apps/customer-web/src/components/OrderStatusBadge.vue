<template>
  <span class="inline-flex w-fit rounded-full px-5 py-3 text-[32px] font-black leading-tight" :class="classes">{{ label }}</span>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { OrderStatus } from "../types/order";

const props = defineProps<{ status: OrderStatus }>();

const labels: Record<OrderStatus, string> = {
  PENDING: "待接單",
  CONFIRMED: "製作中",
  PREPARING: "製作中",
  READY: "可取餐",
  COMPLETED: "已完成",
  CANCELLED: "已取消"
};

const label = computed(() => labels[props.status]);
const classes = computed(() => props.status === "CANCELLED"
  ? "bg-red-100 text-red-700"
  : props.status === "COMPLETED"
    ? "bg-scallion-100 text-scallion-700"
    : props.status === "READY"
      ? "bg-brand-100 text-brand-700"
      : "bg-amber-100 text-amber-800");
</script>
