import { computed, ref, shallowRef } from "vue";

type Notice = { id: string; kind: "success" | "error"; message: string };
const notices = ref<Notice[]>([]);
const timers = new Map<string, ReturnType<typeof setTimeout>>();
const highlights = ref(new Set<string>());
const highlightTimers = new Map<string, ReturnType<typeof setTimeout>>();
const dialogs = shallowRef<{ id: string; element: HTMLDialogElement }[]>([]);
const target = computed(() => dialogs.value.at(-1)?.element ?? "body");

function dismiss(id: string): void {
  clearTimeout(timers.get(id));
  timers.delete(id);
  notices.value = notices.value.filter((notice) => notice.id !== id);
}

function pause(id: string): void {
  clearTimeout(timers.get(id));
  timers.delete(id);
}

function resume(id: string): void {
  pause(id);
  const notice = notices.value.find((item) => item.id === id);
  if (notice) timers.set(id, setTimeout(() => dismiss(id), notice.kind === "error" ? 8000 : 5000));
}

function notify(kind: Notice["kind"], message: string): void {
  const duplicate = notices.value.find((item) => item.message === message && item.kind === kind);
  if (duplicate) { resume(duplicate.id); return; }
  for (const notice of [...notices.value]) dismiss(notice.id);
  const id = crypto.randomUUID();
  notices.value.push({ id, kind, message });
  resume(id);
}

function highlight(id: string): void {
  clearTimeout(highlightTimers.get(id));
  highlights.value.add(id);
  highlightTimers.set(id, setTimeout(() => { highlights.value.delete(id); highlightTimers.delete(id); }, 4000));
}

function clear(): void {
  [...timers.keys()].forEach(dismiss);
  notices.value = [];
  highlightTimers.forEach(clearTimeout);
  highlightTimers.clear();
  highlights.value.clear();
}

export function registerFeedbackDialog(id: string, element: HTMLDialogElement): void {
  dialogs.value = [...dialogs.value.filter((item) => item.id !== id), { id, element }];
}

export function unregisterFeedbackDialog(id: string): void {
  dialogs.value = dialogs.value.filter((item) => item.id !== id);
}

export function useAdminFeedback() {
  return {
    notices, target, dismiss, pause, resume, clear, highlight,
    isHighlighted: (id: string) => highlights.value.has(id),
    success: (message: string) => notify("success", message),
    error: (message: string) => notify("error", message)
  };
}
