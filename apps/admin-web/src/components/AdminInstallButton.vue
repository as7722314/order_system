<template>
  <button
    v-if="canInstall"
    class="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700"
    type="button"
    @click="install"
  >
    <svg aria-hidden="true" class="h-4 w-4" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24">
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
    安裝桌面
  </button>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null);
const canInstall = ref(false);

function isStandalone(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function handleBeforeInstallPrompt(event: Event): void {
  event.preventDefault();
  if (isStandalone()) return;
  deferredPrompt.value = event as BeforeInstallPromptEvent;
  canInstall.value = true;
}

function handleAppInstalled(): void {
  deferredPrompt.value = null;
  canInstall.value = false;
}

async function install(): Promise<void> {
  const promptEvent = deferredPrompt.value;
  if (!promptEvent) return;
  canInstall.value = false;
  await promptEvent.prompt();
  await promptEvent.userChoice.catch(() => undefined);
  deferredPrompt.value = null;
}

onMounted(() => {
  if (isStandalone()) return;
  window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  window.addEventListener("appinstalled", handleAppInstalled);
});

onBeforeUnmount(() => {
  window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  window.removeEventListener("appinstalled", handleAppInstalled);
});
</script>
