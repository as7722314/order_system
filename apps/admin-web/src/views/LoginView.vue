<template>
  <main class="grid min-h-screen place-items-center px-4">
    <form class="w-full max-w-sm rounded-lg border border-stone-200 bg-white p-6 shadow-sm" @submit.prevent="submit">
      <h1 class="text-xl font-semibold">管理者登入</h1>
      <div class="mt-5 space-y-3">
        <input
          v-model="account"
          autocomplete="username"
          autocapitalize="none"
          autocorrect="off"
          class="w-full rounded-md border border-stone-300 p-3"
          placeholder="帳號"
          spellcheck="false"
        />
        <div class="flex rounded-md border border-stone-300 focus-within:ring-2 focus-within:ring-accent/30">
          <input
            v-model="password"
            autocomplete="current-password"
            autocapitalize="none"
            autocorrect="off"
            class="min-w-0 flex-1 rounded-l-md border-0 p-3 outline-none"
            placeholder="密碼"
            spellcheck="false"
            :type="showPassword ? 'text' : 'password'"
          />
          <button
            class="shrink-0 rounded-r-md border-l border-stone-300 bg-stone-50 px-4 text-sm font-medium text-stone-700"
            type="button"
            :aria-pressed="showPassword"
            @click="showPassword = !showPassword"
          >
            {{ showPassword ? "隱藏" : "顯示" }}
          </button>
        </div>
      </div>
      <button class="mt-5 w-full rounded-md bg-accent py-3 font-medium text-white" :disabled="submitting">登入</button>
      <p v-if="error" class="mt-3 text-sm text-red-600">{{ error }}</p>
    </form>
  </main>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAdminAuthStore } from "../stores/adminAuthStore";

const auth = useAdminAuthStore();
const router = useRouter();
const account = ref("");
const password = ref("");
const showPassword = ref(false);
const submitting = ref(false);
const error = ref("");

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
