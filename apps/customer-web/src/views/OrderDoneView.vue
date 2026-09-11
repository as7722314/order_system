<template>
  <main class="customer-shell">
    <section class="hero-panel p-5 text-center">
      <h1 class="hero-title">訂單已送出</h1>
      <p class="mt-6 text-[24px] font-black leading-tight text-stone-700">訂單編號</p>
      <p class="mt-3 break-all rounded-lg bg-[#eef8dc] p-4 text-[30px] font-black leading-tight text-scallion-700">{{ route.params.orderNumber }}</p>
      <RouterLink class="primary-action mt-8 inline-block" to="/">繼續點餐</RouterLink>
    </section>
  </main>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";

const route = useRoute();
</script>
