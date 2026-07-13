<template>
  <main class="w-full space-y-3 px-2 py-2">
    <section class="space-y-3">
      <article v-for="(item, index) in cart.items" :key="`${item.productId}-${index}`" class="rounded-lg border border-brand-100 bg-white/95 p-4 shadow-sm">
        <div class="space-y-4">
          <div class="min-w-0">
            <h2 class="break-words text-[38px] font-black leading-tight text-griddle-800">{{ item.productName }}</h2>
            <p class="mt-3 text-[28px] font-bold leading-tight text-stone-700">NT$ {{ item.unitPrice }} x {{ item.quantity }}</p>
            <p class="mt-3 text-[28px] font-black leading-snug text-scallion-700">{{ item.flavors.map((flavor) => flavor.name).join("、") || "原味" }}</p>
            <p v-if="item.note" class="mt-3 text-[26px] font-bold leading-snug text-stone-600">{{ item.note }}</p>
          </div>
          <button class="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-4 text-[30px] font-black leading-tight text-red-700" @click="cart.remove(index)">移除</button>
        </div>
      </article>
      <div v-if="cart.items.length === 0" class="rounded-lg border border-dashed border-brand-100 bg-white/90 p-5 text-center text-[32px] font-black leading-snug text-stone-600">購物車目前沒有商品</div>
    </section>

    <aside class="rounded-lg border border-brand-100 bg-white/95 p-4 shadow-sm">
      <h2 class="text-[46px] font-black leading-tight text-brand-700">訂單確認</h2>

      <div v-if="!auth.token" class="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p class="text-[26px] font-black leading-snug text-amber-900">請先使用 LINE 登入後再送出訂單。</p>
        <button class="mt-4 w-full rounded-lg bg-scallion-600 py-5 text-[32px] font-black leading-tight text-white" :disabled="submitting" @click="login">
          使用 LINE 登入
        </button>
        <p v-if="auth.loginError" class="mt-3 text-[24px] font-bold leading-snug text-red-700">{{ auth.loginError }}</p>
      </div>

      <div class="mt-5 space-y-5">
        <label class="block">
          <span class="mb-2 block text-[28px] font-black leading-tight text-griddle-800">LINE 姓名</span>
          <input :value="auth.displayName || 'LINE 使用者'" class="w-full rounded-lg border border-brand-100 bg-griddle-50 p-4 text-[30px] font-bold text-stone-700" disabled />
        </label>
        <label class="block">
          <span class="mb-2 block text-[28px] font-black leading-tight text-griddle-800">手機</span>
          <input v-model="customerPhone" class="w-full rounded-lg border border-brand-100 p-4 text-[30px] font-bold" :disabled="!auth.token" inputmode="tel" placeholder="09xxxxxxxx" />
        </label>
        <label class="block">
          <span class="mb-2 block text-[28px] font-black leading-tight text-griddle-800">訂單備註</span>
          <textarea v-model="note" class="w-full rounded-lg border border-brand-100 p-4 text-[30px] font-bold" :disabled="!auth.token" rows="3" placeholder="可留空"></textarea>
        </label>
      </div>
      <div class="mt-6 border-t border-brand-100 pt-5">
        <span class="block text-[30px] font-black leading-tight">合計</span>
        <span class="mt-2 block text-[52px] font-black leading-none text-brand-700">NT$ {{ cart.totalAmount }}</span>
      </div>
      <button class="mt-6 w-full rounded-lg bg-scallion-600 py-5 text-[36px] font-black leading-tight text-white shadow-sm" :disabled="!auth.token || cart.items.length === 0 || submitting" @click="submit">
        送出訂單
      </button>
      <p v-if="error" class="mt-4 text-[26px] font-black leading-snug text-red-700">{{ error }}</p>
    </aside>
  </main>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { createOrder } from "../api/client";
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
