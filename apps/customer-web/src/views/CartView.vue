<template>
  <main class="customer-shell">
    <div class="page-heading">
      <div>
        <span class="menu-eyebrow">YOUR CART</span>
        <h1>購物車</h1>
      </div>
      <span>{{ cart.items.length }} 項</span>
    </div>

    <section class="cart-list">
      <article v-for="(item, index) in cart.items" :key="`${item.productId}-${index}`" class="food-card cart-item">
        <div class="cart-item-main">
          <div class="min-w-0">
            <h2 class="food-title">{{ item.productName }} <small>× {{ item.quantity }}</small></h2>
            <p class="cart-flavors">{{ item.flavors.map((flavor) => flavor.name).join("、") || "原味" }}</p>
            <p v-if="item.note" class="cart-note">{{ item.note }}</p>
          </div>
          <strong class="cart-item-price">NT$ {{ (item.unitPrice + item.flavors.reduce((sum, flavor) => sum + flavor.extraPrice, 0)) * item.quantity }}</strong>
        </div>
        <button class="cart-remove" type="button" @click="cart.remove(index)">移除商品</button>
      </article>
      <div v-if="cart.items.length === 0" class="surface-panel empty-state">
        <span>🛒</span>
        <h2>購物車還是空的</h2>
        <p>先去選一份現煎蔥油餅吧！</p>
        <RouterLink class="primary-action" to="/">開始點餐</RouterLink>
      </div>
    </section>

    <aside v-if="cart.items.length" class="surface-panel checkout-panel">
      <h2>取餐資料</h2>

      <div v-if="!auth.token" class="login-notice">
        <p>請先使用 LINE 登入後再送出訂單。</p>
        <button class="primary-action" :disabled="submitting" @click="login">
          使用 LINE 登入
        </button>
        <p v-if="auth.loginError" class="form-error">{{ auth.loginError }}</p>
      </div>

      <div class="checkout-fields">
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
      <div class="checkout-total">
        <span>合計</span>
        <strong>NT$ {{ cart.totalAmount }}</strong>
      </div>
      <button class="primary-action" :disabled="!auth.token || cart.items.length === 0 || submitting" @click="submit">
        送出訂單
      </button>
      <p v-if="error" class="form-error">{{ error }}</p>
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
