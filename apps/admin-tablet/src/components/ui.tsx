import type { PropsWithChildren, ReactNode } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View, type KeyboardTypeOptions, type StyleProp, type ViewStyle } from "react-native";
import { colors, radius } from "../theme";

export function Page({ title, subtitle, action, children, refreshing = false, onRefresh }: PropsWithChildren<{ title: string; subtitle?: string; action?: ReactNode; refreshing?: boolean; onRefresh?: () => void }>) {
  return <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <View style={styles.pageHeader}>
      <View style={styles.titleBlock}><Text style={styles.pageTitle}>{title}</Text>{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}</View>
      <View style={styles.headerActions}>{onRefresh ? <Button label={refreshing ? "讀取中" : "重新整理"} variant="secondary" disabled={refreshing} onPress={onRefresh} /> : null}{action}</View>
    </View>
    {children}
  </ScrollView>;
}

type ButtonVariant = "primary" | "secondary" | "danger" | "success" | "ghost";
export function Button({ label, onPress, disabled, loading, variant = "primary", small, style }: { label: string; onPress?: () => void; disabled?: boolean; loading?: boolean; variant?: ButtonVariant; small?: boolean; style?: StyleProp<ViewStyle> }) {
  return <Pressable accessibilityRole="button" disabled={disabled || loading} onPress={onPress} style={({ pressed }) => [styles.button, styles[`button_${variant}`], small && styles.buttonSmall, (pressed || disabled || loading) && styles.buttonDim, style]}>
    {loading ? <ActivityIndicator size="small" color={variant === "secondary" || variant === "ghost" ? colors.text : "white"} /> : <Text style={[styles.buttonText, (variant === "secondary" || variant === "ghost") && styles.buttonTextDark]}>{label}</Text>}
  </Pressable>;
}

export function Field({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType, multiline, style }: { label: string; value: string; onChangeText: (value: string) => void; placeholder?: string; secureTextEntry?: boolean; keyboardType?: KeyboardTypeOptions; multiline?: boolean; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.field, style]}><Text style={styles.fieldLabel}>{label}</Text><TextInput autoCapitalize="none" autoCorrect={false} keyboardType={keyboardType} multiline={multiline} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#a8a29e" secureTextEntry={secureTextEntry} style={[styles.input, multiline && styles.textarea]} value={value} /></View>;
}

export function ToggleField({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (value: boolean) => void }) {
  return <View style={styles.toggle}><Text style={styles.fieldLabel}>{label}</Text><Switch trackColor={{ false: "#d6d3d1", true: "#fdba74" }} thumbColor={value ? colors.accent : "#f5f5f4"} value={value} onValueChange={onValueChange} /></View>;
}

export function Card({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) { return <View style={[styles.card, style]}>{children}</View>; }
export function Divider() { return <View style={styles.divider} />; }
export function ErrorNotice({ message }: { message?: string }) { return message ? <View style={styles.error}><Text style={styles.errorText}>{message}</Text></View> : null; }
export function Empty({ text }: { text: string }) { return <View style={styles.empty}><Text style={styles.subtitle}>{text}</Text></View>; }

export function Chip({ label, selected, onPress, tone = "default" }: { label: string; selected?: boolean; onPress?: () => void; tone?: "default" | "success" | "warning" | "danger" | "info" }) {
  const palette = tone === "success" ? [colors.successSoft, colors.success] : tone === "warning" ? [colors.warningSoft, colors.warning] : tone === "danger" ? [colors.dangerSoft, colors.danger] : tone === "info" ? [colors.infoSoft, colors.info] : [colors.surfaceMuted, colors.textMuted];
  return <Pressable disabled={!onPress} onPress={onPress} style={[styles.chip, { backgroundColor: selected ? colors.accent : palette[0], borderColor: selected ? colors.accent : palette[0] }]}><Text style={[styles.chipText, { color: selected ? "white" : palette[1] }]}>{label}</Text></Pressable>;
}

export function FormModal({ visible, title, subtitle, children, onClose }: PropsWithChildren<{ visible: boolean; title: string; subtitle?: string; onClose: () => void }>) {
  return <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}><View style={styles.modalBackdrop}><View style={styles.modalCard}>
    <View style={styles.modalHeader}><View style={styles.titleBlock}><Text style={styles.modalTitle}>{title}</Text>{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}</View><Button label="關閉" variant="ghost" small onPress={onClose} /></View>
    <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">{children}</ScrollView>
  </View></View></Modal>;
}

export const ui = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 12, alignItems: "center" },
  spread: { flexDirection: "row", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: "700" },
  title: { color: colors.text, fontSize: 16, fontWeight: "700" },
  body: { color: colors.text, fontSize: 15, lineHeight: 22 },
  muted: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  strong: { color: colors.text, fontSize: 17, fontWeight: "700" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  gap: { gap: 12 },
  actions: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-end", gap: 8 },
});

const styles = StyleSheet.create({
  page: { padding: 24, gap: 18, paddingBottom: 48 },
  pageHeader: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 16 },
  titleBlock: { gap: 4, flexShrink: 1 },
  pageTitle: { color: colors.text, fontSize: 27, fontWeight: "800" },
  subtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  headerActions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  button: { minHeight: 44, borderRadius: radius.small, paddingHorizontal: 18, paddingVertical: 11, alignItems: "center", justifyContent: "center" },
  buttonSmall: { minHeight: 36, paddingHorizontal: 12, paddingVertical: 7 },
  button_primary: { backgroundColor: colors.accent },
  button_secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  button_danger: { backgroundColor: colors.danger },
  button_success: { backgroundColor: colors.success },
  button_ghost: { backgroundColor: colors.surfaceMuted },
  buttonDim: { opacity: 0.55 },
  buttonText: { color: "white", fontSize: 14, fontWeight: "700" },
  buttonTextDark: { color: colors.text },
  field: { minWidth: 160, flexGrow: 1, gap: 6 },
  fieldLabel: { color: colors.text, fontSize: 14, fontWeight: "600" },
  input: { minHeight: 46, borderWidth: 1, borderColor: colors.border, borderRadius: radius.small, backgroundColor: colors.surface, color: colors.text, fontSize: 15, paddingHorizontal: 13, paddingVertical: 10 },
  textarea: { minHeight: 90, textAlignVertical: "top" },
  toggle: { minHeight: 46, minWidth: 130, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.medium, padding: 16, gap: 12 },
  divider: { height: 1, backgroundColor: colors.border },
  error: { borderRadius: radius.small, backgroundColor: colors.dangerSoft, padding: 12 },
  errorText: { color: colors.danger, fontSize: 14, lineHeight: 20 },
  empty: { padding: 28, alignItems: "center", borderWidth: 1, borderStyle: "dashed", borderColor: colors.border, borderRadius: radius.medium },
  chip: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7 },
  chipText: { fontSize: 13, fontWeight: "700" },
  modalBackdrop: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "rgba(28,25,23,0.48)" },
  modalCard: { width: "100%", maxWidth: 820, maxHeight: "92%", alignSelf: "center", backgroundColor: colors.surface, borderRadius: radius.large, overflow: "hidden" },
  modalHeader: { padding: 18, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  modalTitle: { color: colors.text, fontSize: 21, fontWeight: "800" },
  modalBody: { padding: 18, gap: 16 },
});
