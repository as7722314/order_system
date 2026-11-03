import type { PropsWithChildren } from "react";
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { APP_ENV } from "../api";
import { colors } from "../theme";
import { Button } from "./ui";

export type ScreenKey = "dashboard" | "orders" | "products" | "categories" | "flavors" | "expenses" | "reports";
const navigation: { key: ScreenKey; icon: string; label: string }[] = [
  { key: "dashboard", icon: "⌂", label: "儀表板" },
  { key: "orders", icon: "▤", label: "訂單" },
  { key: "products", icon: "◇", label: "商品" },
  { key: "flavors", icon: "✦", label: "口味" },
  { key: "expenses", icon: "$", label: "成本" },
  { key: "reports", icon: "↗", label: "報表" },
];

export function AdminLayout({ active, unreadOrders, onSelect, onSignOut, children }: PropsWithChildren<{
  active: ScreenKey;
  unreadOrders: number;
  onSelect: (screen: ScreenKey) => void;
  onSignOut: () => void;
}>) {
  const { width, fontScale } = useWindowDimensions();
  const tablet = width >= 760;
  const navItems = navigation.map((item) => <Pressable
    key={item.key}
    accessibilityRole="tab"
    accessibilityLabel={item.label}
    accessibilityState={{ selected: active === item.key }}
    onPress={() => onSelect(item.key)}
    style={({ pressed }) => [styles.navItem, !tablet && styles.compactItem, active === item.key && styles.navItemActive, pressed && styles.navItemPressed]}
  >
    <Text style={[styles.navIcon, active === item.key && styles.navTextActive]}>{item.icon}</Text>
    <Text numberOfLines={1} style={[styles.navText, active === item.key && styles.navTextActive]}>{item.label}</Text>
    {item.key === "orders" && unreadOrders > 0 ? <View style={[styles.badge, !tablet && styles.compactBadge]}><Text style={styles.badgeText}>{unreadOrders > 99 ? "99+" : unreadOrders}</Text></View> : null}
  </Pressable>);

  return <SafeAreaView style={styles.safe}>
    <StatusBar style="dark" />
    <View style={[styles.shell, !tablet && styles.shellCompact]}>
      {tablet ? <View style={styles.sidebar} testID="admin-sidebar">
        <View style={styles.brand}><View style={styles.brandMark}><Text style={styles.brandLetter}>O</Text></View><View style={styles.brandCopy}><Text style={styles.brandTitle}>點餐管理</Text><Text style={styles.brandSub}>{APP_ENV === "local" ? "本機測試" : "門市營運管理"}</Text></View></View>
        <ScrollView style={styles.sideNav} contentContainerStyle={styles.sideNavItems} showsVerticalScrollIndicator={false} testID="admin-navigation">{navItems}</ScrollView>
        <Button label="登出" variant="secondary" onPress={onSignOut} />
      </View> : <>
        <View style={styles.mobileHeader}><Text style={styles.brandTitle}>點餐管理</Text><Button label="登出" variant="ghost" small onPress={onSignOut} /></View>
        <ScrollView horizontal style={[styles.mobileNav, { height: Math.max(64, Math.ceil(24 * fontScale) + 28) }]} contentContainerStyle={styles.mobileNavItems} showsHorizontalScrollIndicator={false} testID="admin-navigation">{navItems}</ScrollView>
      </>}
      <View style={styles.content} testID="admin-content">{children}</View>
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  shell: { flex: 1, minHeight: 0, flexDirection: "row", backgroundColor: colors.background },
  shellCompact: { flexDirection: "column" },
  sidebar: { width: 220, flexShrink: 0, padding: 18, gap: 20, borderRightWidth: 1, borderRightColor: colors.border, backgroundColor: colors.surface },
  brand: { flexDirection: "row", alignItems: "center", gap: 11, flexShrink: 0 },
  brandMark: { width: 38, height: 38, flexShrink: 0, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: colors.accent },
  brandLetter: { color: "white", fontSize: 20, fontWeight: "900" },
  brandCopy: { flex: 1, minWidth: 0, gap: 3 },
  brandTitle: { color: colors.text, fontSize: 18, fontWeight: "900" },
  brandSub: { color: colors.textMuted, fontSize: 11 },
  sideNav: { flex: 1, minHeight: 0 },
  sideNavItems: { gap: 5, paddingBottom: 4 },
  navItem: { minHeight: 46, flexShrink: 0, paddingHorizontal: 13, paddingVertical: 10, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 10 },
  compactItem: { alignSelf: "center" },
  navItemActive: { backgroundColor: colors.accentSoft },
  navItemPressed: { opacity: .65 },
  navIcon: { width: 20, flexShrink: 0, color: colors.textMuted, fontSize: 18, textAlign: "center", fontWeight: "700" },
  navText: { flexShrink: 0, color: colors.textMuted, fontSize: 15, fontWeight: "700" },
  navTextActive: { color: colors.accent },
  badge: { minWidth: 21, minHeight: 21, flexShrink: 0, paddingHorizontal: 5, marginLeft: "auto", alignItems: "center", justifyContent: "center", borderRadius: 11, backgroundColor: colors.danger },
  compactBadge: { marginLeft: 0 },
  badgeText: { color: "white", fontSize: 11, fontWeight: "900" },
  mobileHeader: { minHeight: 58, flexShrink: 0, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface },
  mobileNav: { flexGrow: 0, flexShrink: 0, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  mobileNavItems: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 8, gap: 4 },
  content: { flex: 1, minWidth: 0, minHeight: 0 },
});
