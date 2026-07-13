export function registerAdminServiceWorker(): void {
  if (!("serviceWorker" in navigator)) return;
  if (import.meta.env.DEV) return;

  const base = import.meta.env.BASE_URL || "/";
  const serviceWorkerUrl = `${base}admin-service-worker.js`;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register(serviceWorkerUrl, { scope: base }).catch((error: unknown) => {
      console.warn("[admin-pwa] service worker registration failed", error);
    });
  });
}
