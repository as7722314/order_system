import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { login } from "../api/client";

export const useAdminAuthStore = defineStore("adminAuth", () => {
  const token = ref(localStorage.getItem("admin_token"));
  const isLoggedIn = computed(() => Boolean(token.value));

  async function signIn(account: string, password: string): Promise<void> {
    token.value = await login(account, password);
    localStorage.setItem("admin_token", token.value);
  }

  function logout(): void {
    token.value = null;
    localStorage.removeItem("admin_token");
  }

  return { token, isLoggedIn, signIn, logout };
});
