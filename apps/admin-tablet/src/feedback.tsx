import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "./theme";
import { errorMessage } from "./utils";

type Notice = { id: number; kind: "success" | "error"; message: string };
type Feedback = {
  notice: Notice | null; modal: string | null; highlights: Set<string>;
  notify: (kind: Notice["kind"], message: string) => void; dismiss: () => void; clear: () => void;
  highlight: (id: string) => void; registerModal: (id: string, visible: boolean) => void;
};
const Context = createContext<Feedback | null>(null);

export function FeedbackProvider({ children }: PropsWithChildren) {
  const [notice, setNotice] = useState<Notice | null>(null);
  const [modals, setModals] = useState<string[]>([]);
  const [highlights, setHighlights] = useState(new Set<string>());
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const highlightTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const sequence = useRef(0);
  const dismiss = useCallback(() => { clearTimeout(timer.current); setNotice(null); }, []);
  const notify = useCallback((kind: Notice["kind"], message: string) => {
    clearTimeout(timer.current);
    setNotice({ id: ++sequence.current, kind, message });
    timer.current = setTimeout(() => setNotice(null), kind === "error" ? 8000 : 5000);
  }, []);
  const highlight = useCallback((id: string) => {
    clearTimeout(highlightTimers.current.get(id));
    setHighlights((current) => new Set(current).add(id));
    highlightTimers.current.set(id, setTimeout(() => {
      setHighlights((current) => { const next = new Set(current); next.delete(id); return next; });
      highlightTimers.current.delete(id);
    }, 4000));
  }, []);
  const clear = useCallback(() => { dismiss(); highlightTimers.current.forEach(clearTimeout); highlightTimers.current.clear(); setHighlights(new Set()); }, [dismiss]);
  const registerModal = useCallback((id: string, visible: boolean) => setModals((current) => visible ? [...current.filter((value) => value !== id), id] : current.filter((value) => value !== id)), []);
  useEffect(() => () => { clearTimeout(timer.current); highlightTimers.current.forEach(clearTimeout); }, []);
  const value = useMemo(() => ({ notice, modal: modals.at(-1) ?? null, highlights, notify, dismiss, clear, highlight, registerModal }), [notice, modals, highlights, notify, dismiss, clear, highlight, registerModal]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useFeedback() {
  const feedback = useContext(Context);
  if (!feedback) throw new Error("FeedbackProvider is required");
  return feedback;
}

export function FeedbackToast({ scope = null }: { scope?: string | null }) {
  const { notice, modal, dismiss } = useFeedback();
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => { if (notice) { opacity.setValue(0); Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: false }).start(); } }, [notice?.id, opacity]);
  if (!notice || modal !== scope) return null;
  return <View pointerEvents="box-none" style={[styles.position, { top: Math.max(12, insets.top + 8) }]}><Animated.View accessibilityLiveRegion={notice.kind === "error" ? "assertive" : "polite"} style={[styles.toast, notice.kind === "error" && styles.error, { opacity }]}>
    <Text style={[styles.symbol, { color: notice.kind === "error" ? colors.danger : colors.success }]}>{notice.kind === "error" ? "!" : "✓"}</Text><View style={styles.copy}><Text style={styles.title}>{notice.kind === "error" ? "操作未完成" : "操作完成"}</Text><Text style={styles.message}>{notice.message}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="關閉操作提示" hitSlop={10} onPress={dismiss} style={styles.close}><Text style={styles.symbol}>×</Text></Pressable>
  </Animated.View></View>;
}

export function useActionFeedback(onError: (message: string) => void) {
  const feedback = useFeedback();
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const mounted = useRef(true);
  const errorHandler = useRef(onError); errorHandler.current = onError;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const run = async <T,>(work: () => Promise<T>, options: { success: string | ((result: T) => string); failure: string; highlight?: (result: T) => string | undefined }) => {
    if (lock.current) return;
    lock.current = true; setBusy(true); errorHandler.current("");
    try {
      const result = await work();
      if (!mounted.current) return result;
      const id = options.highlight?.(result); if (id) feedback.highlight(id);
      feedback.notify("success", typeof options.success === "function" ? options.success(result) : options.success);
      return result;
    } catch (reason) {
      const message = errorMessage(reason, options.failure);
      if (mounted.current) { errorHandler.current(message); feedback.notify("error", message); }
    } finally { lock.current = false; if (mounted.current) setBusy(false); }
  };
  return { busy, run };
}

const styles = StyleSheet.create({
  position: { position: "absolute", right: 16, left: 16, alignItems: "flex-end", zIndex: 1000 },
  toast: { width: "100%", maxWidth: 420, flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: "#cdddc4", backgroundColor: "#f6fbef", elevation: 12, boxShadow: "0 8px 24px rgba(55,35,20,.15)" },
  error: { backgroundColor: "#fff4ec", borderColor: "#edcabb" },
  copy: { flex: 1, gap: 4 }, title: { color: colors.text, fontSize: 14, fontWeight: "800" }, message: { color: colors.text, fontSize: 14, lineHeight: 21 }, symbol: { fontSize: 21, fontWeight: "800", color: colors.textMuted }, close: { minWidth: 30, minHeight: 30, alignItems: "center", justifyContent: "center" },
});
