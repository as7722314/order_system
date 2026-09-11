<template>
  <main class="customer-shell space-y-4">
    <section class="space-y-3">
      <article v-for="(item, index) in cart.items" :key="`${item.productId}-${index}`" class="food-card p-4">
        <div class="space-y-4">
          <div class="min-w-0">
            <h2 class="food-title">{{ item.productName }}</h2>
            <p class="food-copy">NT$ {{ item.unitPrice }} x {{ item.quantity }}</p>
            <p class="mt-3 rounded-lg bg-[#eef8dc] p-3 text-[24px] font-black leading-snug text-scallion-700">{{ item.flavors.map((flavor) => flavor.name).join("、") || "原味" }}</p>
            <p v-if="item.note" class="mt-3 text-[23px] font-bold leading-snug text-stone-600">{{ item.note }}</p>
          </div>
          <button class="danger-action" @click="cart.remove(index)">移除</button>
        </div>
      </article>
      <div v-if="cart.items.length === 0" class="surface-panel text-center text-[30px] font-black leading-snug text-stone-600">購物車目前沒有商品</div>
    </section>

    <aside class="surface-panel">
      <h2 class="hero-title">訂單確認</h2>

      <div v-if="!auth.token" class="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p class="text-[24px] font-black leading-snug text-amber-900">請先使用 LINE 登入後再送出訂單。</p>
        <button class="primary-action mt-4" :disabled="submitting" @click="login">
          使用 LINE 登入
        </button>
        <p v-if="auth.loginError" class="mt-3 text-[24px] font-bold leading-snug text-red-700">{{ auth.loginError }}</p>
      </div>

      <div class="mt-5 space-y-5">
        <label class="block">
          <span class="field-label">LINE 姓名</span>
          <input :value="auth.displayName || 'LINE 使用者'" class="field-input bg-griddle-50 text-stone-700" disabled />
        </label>
        <label class="block">
          <span class="field-label">手機</span>
          <input v-model="customerPhone" class="field-input" :disabled="!auth.token" inputmode="tel" placeholder="09xxxxxxxx" />
        </label>
        <label class="block">
          <span class="field-label">訂單備註</span>
          <textarea v-model="note" class="field-input" :disabled="!auth.token" rows="3" placeholder="可留空"></textarea>
        </label>
      </div>
      <div class="mt-6 border-t border-brand-100 pt-5">
        <span class="price-label">合計</span>
        <span class="price-value block">NT$ {{ cart.totalAmount }}</span>
      </div>
      <button class="primary-action mt-6" :disabled="!auth.token || cart.items.length === 0 || submitting" @click="submit">
        送出訂單
      </button>
      <p v-if="error" class="mt-4 text-[26px] font-black leading-snug text-red-700">{{ error }}</p>
    </aside>
  </main>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { createOrder, fetchStoreStatus } from "../api/client";
import { useAuthStore } from "../stores/authStore";
import { useCartStore } from "../stores/cartStore";

const cart = useCartStore();
const auth = useAuthStore();
const router = useRouter();
const customerPhone = ref("");
const note = ref("");
const submitting = ref(false);
const error = ref("");

async function login(): Promise<void> {
  submitting.value = true;
  error.value = "";
  try {
    await auth.loginWithLine();
  } catch {
    error.value = auth.loginError || "LINE 登入失敗";
  } finally {
    submitting.value = false;
  }
}

async function submit(): Promise<void> {
  if (!auth.token) {
    error.value = "請先使用 LINE 登入後再送出訂單。";
    return;
  }
  submitting.value = true;
  error.value = "";
  try {
    const storeStatus = await fetchStoreStatus();
    if (!storeStatus.isOpen) {
      window.dispatchEvent(new CustomEvent("store-status-closed", { detail: storeStatus }));
      error.value = "目前非營業時間，暫停點餐。";
      return;
    }
    const result = await createOrder({
      customerPhone: customerPhone.value,
      note: note.value || undefined,
      items: cart.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        flavorIds: item.flavors.map((flavor) => flavor.id),
        note: item.note || undefined
      }))
    });
    cart.clear();
    await router.push(`/done/${result.orderNumber}`);
  } catch {
    error.value = "訂單送出失敗，請確認手機格式為 09 開頭共 10 碼。";
  } finally {
    submitting.value = false;
  }
}
</script>
