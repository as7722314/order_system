<template>
  <main class="w-full px-2 py-3">
    <section class="rounded-lg border border-brand-100 bg-white/95 p-5 text-center shadow-sm">
      <h1 class="text-[50px] font-black leading-tight text-brand-700">訂單已送出</h1>
      <p class="mt-6 text-[30px] font-black leading-tight text-stone-700">訂單編號</p>
      <p class="mt-3 break-all text-[40px] font-black leading-tight text-scallion-700">{{ route.params.orderNumber }}</p>
      <RouterLink class="mt-8 inline-block w-full rounded-lg bg-scallion-600 px-3 py-5 text-[34px] font-black leading-tight text-white" to="/">繼續點餐</RouterLink>
    </section>
  </main>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";

const route = useRoute();
</script>
