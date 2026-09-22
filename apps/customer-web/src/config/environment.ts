export const APP_ENV = import.meta.env.VITE_APP_ENV || (import.meta.env.PROD ? "production" : "local");
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

const productionApiHost = "line-order-system-api.onrender.com";
const apiHost = new URL(API_BASE_URL, window.location.origin).hostname;

if (APP_ENV !== "production" && apiHost === productionApiHost) {
  throw new Error("安全性檢查失敗：本地 Web 不可連線正式 API");
}
