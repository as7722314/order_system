import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { API_BASE_URL } from "../api";
import { useAuth } from "../auth";
import { colors, radius } from "../theme";
import { errorMessage } from "../utils";
import { Button, ErrorNotice, Field } from "../components/ui";

export function LoginScreen() {
  const { signIn } = useAuth();
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async () => {
    if (!account.trim() || !password) { setError("請輸入帳號與密碼"); return; }
    setBusy(true); setError("");
    try { await signIn(account.trim(), password); } catch (reason) { setError(errorMessage(reason, "登入失敗，請確認帳號或密碼")); } finally { setBusy(false); }
  };
  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
    <View style={styles.hero}>
      <Text style={styles.eyebrow}>ORDER OPERATIONS</Text>
      <Text style={styles.heading}>點餐管理</Text>
      <Text style={styles.copy}>為平板設計的門市營運中心，快速處理訂單、商品與帳務。</Text>
    </View>
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.title}>管理者登入</Text>
        <Text style={styles.hint}>登入後憑證將安全儲存在此裝置。</Text>
      </View>
      <View style={styles.form}>
        <Field label="帳號" value={account} onChangeText={setAccount} placeholder="請輸入管理帳號" style={styles.loginField} />
        <Field label="密碼" value={password} onChangeText={setPassword} placeholder="請輸入密碼" secureTextEntry style={styles.loginField} />
        <ErrorNotice message={error} />
        <Button label="登入管理介面" loading={busy} onPress={() => void submit()} />
      </View>
      <Text style={styles.endpoint}>API：{API_BASE_URL}</Text>
    </View>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, flexDirection: "row", flexWrap: "wrap", alignContent: "center", alignItems: "center", justifyContent: "center", gap: 50, padding: 32, backgroundColor: colors.background },
  hero: { width: 380, maxWidth: "100%", gap: 12 },
  eyebrow: { color: colors.accent, letterSpacing: 2, fontSize: 13, fontWeight: "800" },
  heading: { color: colors.text, fontSize: 48, fontWeight: "900" },
  copy: { color: colors.textMuted, fontSize: 18, lineHeight: 29 },
  card: { width: 420, maxWidth: "100%", padding: 28, gap: 24, backgroundColor: colors.surface, borderRadius: radius.large, borderWidth: 1, borderColor: colors.border },
  cardHeader: { gap: 8 },
  form: { gap: 16 },
  loginField: { flexGrow: 0 },
  title: { color: colors.text, fontSize: 24, fontWeight: "800" },
  hint: { color: colors.textMuted, fontSize: 14 },
  endpoint: { color: colors.textMuted, fontSize: 11, textAlign: "center" },
});
