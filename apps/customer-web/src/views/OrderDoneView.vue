<template>
  <main class="customer-shell">
    <section class="surface-panel success-panel">
      <span class="success-icon">✓</span>
      <h1>訂單已送出</h1>
      <p>店家收到訂單後會盡快為你準備</p>
      <div class="order-number-box">
        <small>訂單編號</small>
        <strong>{{ route.params.orderNumber }}</strong>
      </div>
      <RouterLink class="primary-action" to="/orders">查看訂單進度</RouterLink>
      <RouterLink class="continue-link" to="/">繼續點餐</RouterLink>
    </section>
  </main>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";

const route = useRoute();
</script>
