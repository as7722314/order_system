<template>
  <Teleport to="body">
    <dialog ref="dialog" class="admin-modal" :class="`admin-modal--${size}`" aria-modal="true" :aria-labelledby="`${id}-title`" :aria-describedby="description ? `${id}-description` : undefined" :aria-busy="busy" @cancel.prevent="requestClose" @keydown.tab="trapFocus">
      <div v-if="open" class="admin-modal-panel">
        <header class="admin-modal-header">
          <div>
            <p class="admin-eyebrow">{{ eyebrow }}</p>
            <h2 :id="`${id}-title`" class="text-xl font-semibold">{{ title }}</h2>
            <p v-if="description" :id="`${id}-description`" class="mt-2 text-sm leading-relaxed text-stone-500">{{ description }}</p>
          </div>
          <button class="admin-icon-button" type="button" aria-label="關閉視窗" :disabled="busy" @click="requestClose"><AdminIcon name="close" /></button>
        </header>
        <div class="admin-modal-body"><slot /></div>
        <footer v-if="$slots.footer" class="admin-modal-footer"><slot name="footer" /></footer>
      </div>
    </dialog>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from "vue";
import AdminIcon from "./AdminIcon.vue";

const props = withDefaults(defineProps<{
  open: boolean;
  title: string;
  description?: string;
  eyebrow?: string;
  busy?: boolean;
  size?: "sm" | "md" | "lg";
}>(), { description: "", eyebrow: "資料管理", busy: false, size: "md" });
const emit = defineEmits<{ close: [] }>();
const id = `admin-modal-${crypto.randomUUID()}`;
const dialog = ref<HTMLDialogElement>();
let previousOverflow: string | undefined;

function requestClose(): void {
  if (!props.busy) emit("close");
}

function trapFocus(event: KeyboardEvent): void {
  const controls = Array.from(dialog.value?.querySelectorAll<HTMLElement>(
    'button, input:not([type="hidden"]), select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
  ) ?? []).filter((element) => !element.matches(":disabled") && element.getClientRects().length > 0);
  const first = controls[0];
  const last = controls[controls.length - 1];
  if (!first) {
    event.preventDefault();
  } else if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function unlockScroll(): void {
  if (previousOverflow === undefined) return;
  document.body.style.overflow = previousOverflow;
  previousOverflow = undefined;
}

watch(() => props.open, async (open) => {
  await nextTick();
  if (!dialog.value || props.open !== open) return;
  if (open && !dialog.value.open) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.value.showModal();
    dialog.value.querySelector<HTMLElement>("[autofocus], [data-modal-initial-focus]")?.focus();
  } else if (!open) {
    dialog.value.close();
    unlockScroll();
  }
}, { immediate: true, flush: "post" });

onBeforeUnmount(() => {
  dialog.value?.close();
  unlockScroll();
});
</script>
