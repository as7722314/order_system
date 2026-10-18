<template>
  <main class="admin-login">
    <div class="admin-login-frame">
      <section class="admin-login-story">
        <div>
          <div class="admin-brand"><span class="admin-brand-mark">何</span><span><strong>何佳佳蔥油餅</strong><small>門市管理後台</small></span></div>
          <h2>從接單到日結，<br />把營運整理好。</h2>
          <p>訂單進度、商品設定與營業報表，<br />讓每天的門市日常，清楚掌握。</p>
        </div>
        <footer>用心做好每一份，也用心經營每一天。</footer>
      </section>
      <form class="admin-login-form" @submit.prevent="submit">
        <div class="admin-brand"><span class="admin-brand-mark">何</span><span><strong>何佳佳蔥油餅</strong><small>門市管理後台</small></span></div>
        <p class="admin-eyebrow">門市管理</p>
        <h1>歡迎回來</h1>
        <p class="admin-login-intro">登入管理帳號，開始今天的營運。</p>
        <div class="mt-8 space-y-5">
          <div><label for="admin-account">管理帳號</label><input id="admin-account" v-model="account" autocomplete="username" autocapitalize="none" autocorrect="off" class="w-full rounded-md border border-stone-300 p-3" placeholder="請輸入帳號" spellcheck="false" /></div>
          <div>
            <label for="admin-password">登入密碼</label>
            <div class="flex overflow-hidden rounded-md border border-stone-300 focus-within:ring-2 focus-within:ring-accent/30">
              <input id="admin-password" v-model="password" autocomplete="current-password" autocapitalize="none" autocorrect="off" class="min-w-0 flex-1 border-0 p-3 outline-none" placeholder="請輸入密碼" spellcheck="false" :type="showPassword ? 'text' : 'password'" />
              <button class="shrink-0 border-l border-stone-200 bg-stone-50 px-4 text-sm font-medium text-stone-600" type="button" :aria-pressed="showPassword" @click="showPassword = !showPassword">{{ showPassword ? "隱藏" : "顯示" }}</button>
            </div>
          </div>
        </div>
        <button class="admin-login-submit mt-7 w-full rounded-md bg-accent py-3 text-sm font-semibold text-white" :disabled="submitting">{{ submitting ? "登入中…" : "登入管理後台" }}</button>
        <p v-if="sessionExpired" class="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-800">登入已過期，請重新登入。</p>
        <p v-if="error" class="mt-4 text-sm text-red-600" role="alert">{{ error }}</p>
      </form>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAdminAuthStore } from "../stores/adminAuthStore";

const auth = useAdminAuthStore();
const route = useRoute();
const router = useRouter();
const account = ref("");
const password = ref("");
const showPassword = ref(false);
const submitting = ref(false);
const error = ref("");
const sessionExpired = computed(() => route.query.reason === "expired");

async function submit(): Promise<void> {
  submitting.value = true;
  error.value = "";
  try {
    await auth.signIn(account.value.trim(), password.value);
    await router.push("/");
  } catch {
    error.value = "登入失敗，請確認帳號或密碼。";
  } finally {
    submitting.value = false;
  }
}
</script>
