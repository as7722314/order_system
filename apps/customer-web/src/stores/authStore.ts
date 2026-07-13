import liff from "@line/liff";
import { defineStore } from "pinia";
import { ref } from "vue";
import { api } from "../api/client";

const idTokenRetryKey = "line_id_token_retry";

function getRedirectUri(): string {
  return window.location.href;
}

function isLineInAppBrowser(): boolean {
  return /Line\//i.test(window.navigator.userAgent);
}

function startLineLogin(): void {
  liff.login({ redirectUri: getRedirectUri() });
}

export const useAuthStore = defineStore("auth", () => {
  const token = ref(localStorage.getItem("customer_token"));
  const displayName = ref<string | null>(localStorage.getItem("customer_name"));
  const loginError = ref("");

  async function loginWithLine(): Promise<void> {
    loginError.value = "";
    const liffId = import.meta.env.VITE_LINE_LIFF_ID as string | undefined;
    if (!liffId) {
      loginError.value = "尚未設定 LINE LIFF ID，請先設定 VITE_LINE_LIFF_ID 後重新建置前端。";
      throw new Error(loginError.value);
    }

    await liff.init({ liffId });
    if (!liff.isInClient() && !isLineInAppBrowser()) {
      logout();
      loginError.value = "請從官方 LINE 內開啟點餐頁面，外部瀏覽器暫不開放點餐。";
      throw new Error(loginError.value);
    }

    if (!liff.isLoggedIn()) {
      startLineLogin();
      return;
    }

    const idToken = liff.getIDToken();
    if (!idToken) {
      const alreadyRetried = sessionStorage.getItem(idTokenRetryKey) === "1";
      if (!alreadyRetried) {
        sessionStorage.setItem(idTokenRetryKey, "1");
        liff.logout();
        startLineLogin();
        return;
      }

      sessionStorage.removeItem(idTokenRetryKey);
      loginError.value = "LINE 登入未取得 ID Token。請確認 LINE LIFF Scope 已啟用 openid/profile，Endpoint URL 是目前網址，然後從 LINE 重新開啟。";
      throw new Error(loginError.value);
    }

    sessionStorage.removeItem(idTokenRetryKey);
    const response = await api.post("/auth/line", { idToken });
    const data = response.data.data as { accessToken: string; user: { displayName?: string | null } };
    token.value = data.accessToken;
    displayName.value = data.user.displayName ?? null;
    localStorage.setItem("customer_token", data.accessToken);
    if (displayName.value) localStorage.setItem("customer_name", displayName.value);
  }

  function logout(): void {
    token.value = null;
    displayName.value = null;
    localStorage.removeItem("customer_token");
    localStorage.removeItem("customer_name");
  }

  return { token, displayName, loginError, loginWithLine, logout };
});
