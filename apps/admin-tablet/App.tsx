import { useEffect, useRef, useState, type ComponentType } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "./src/auth";
import { adminApi, APP_ENV } from "./src/api";
import { notifyNewOrders, prepareOrderNotifications, registerForOrderPushNotifications, subscribeToOrderNotificationResponses } from "./src/notifications";
import { Button } from "./src/components/ui";
import { CategoriesScreen } from "./src/screens/CategoriesScreen";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { ExpensesScreen } from "./src/screens/ExpensesScreen";
import { FlavorsScreen } from "./src/screens/FlavorsScreen";
import { LoginScreen } from "./src/screens/LoginScreen";
import { OrdersScreen } from "./src/screens/OrdersScreen";
import { ProductsScreen } from "./src/screens/ProductsScreen";
import { ReportsScreen } from "./src/screens/ReportsScreen";
import { colors } from "./src/theme";

type ScreenKey = "dashboard" | "orders" | "products" | "categories" | "flavors" | "expenses" | "reports";
const screens: Record<ScreenKey, ComponentType> = { dashboard: DashboardScreen, orders: OrdersScreen, products: ProductsScreen, categories: CategoriesScreen, flavors: FlavorsScreen, expenses: ExpensesScreen, reports: ReportsScreen };
const navigation: { key: ScreenKey; icon: string; label: string }[] = [
  { key: "dashboard", icon: "⌂", label: "儀表板" }, { key: "orders", icon: "▤", label: "訂單" }, { key: "products", icon: "◇", label: "商品" }, { key: "flavors", icon: "✦", label: "口味" }, { key: "expenses", icon: "$", label: "成本" }, { key: "reports", icon: "↗", label: "報表" },
];

function Shell() {
  const { loading, token, signOut } = useAuth();
  const { width } = useWindowDimensions();
  const tablet = width >= 760;
  const [active, setActive] = useState<ScreenKey>("dashboard");
  const [unreadOrders, setUnreadOrders] = useState(0);
  const knownPending = useRef<Set<string> | null>(null);
  const registeredPushToken = useRef<string | null>(null);
  const pushNotificationsReady = useRef(false);

  useEffect(() => subscribeToOrderNotificationResponses(() => {
    setActive("orders");
    setUnreadOrders(0);
  }), []);

  useEffect(() => {
    if (!token) return;
    let mounted = true;
    pushNotificationsReady.current = false;
    void registerForOrderPushNotifications().then(async (pushToken) => {
      if (!mounted || !pushToken) return;
      const platform = Platform.OS === "ios" ? "ios" : "android";
      await adminApi.registerPushToken(pushToken, platform);
      if (mounted) {
        registeredPushToken.current = pushToken;
        pushNotificationsReady.current = true;
      }
    }).catch((error: unknown) => {
      console.warn("[push-notifications] failed to register with the API", error);
    });
    return () => { mounted = false; };
  }, [token]);

  useEffect(() => {
    if (!token) return;
    let mounted = true;
    void prepareOrderNotifications();
    const checkOrders = async () => {
      try {
        const pending = await adminApi.listOrders({ status: "PENDING", pageSize: 100 });
        if (!mounted) return;
        const ids = new Set(pending.map((order) => order.id));
        if (knownPending.current) {
          const newOrders = pending.filter((order) => !knownPending.current?.has(order.id));
          if (newOrders.length) {
            setUnreadOrders((count) => count + newOrders.length);
            const latest = newOrders[0];
            if (!pushNotificationsReady.current) {
              try { await notifyNewOrders(newOrders); } catch { /* The in-app alert remains available if OS notifications are disabled. */ }
            }
            Alert.alert("新訂單", `${latest.orderNumber} · ${latest.customerName}\n共 ${newOrders.length} 筆新訂單待處理`, [{ text: "稍後處理" }, { text: "查看訂單", onPress: () => { setActive("orders"); setUnreadOrders(0); } }]);
          }
        }
        knownPending.current = ids;
      } catch { /* Individual screens show connection errors; notification polling retries automatically. */ }
    };
    void checkOrders();
    const timer = setInterval(() => void checkOrders(), 20000);
    return () => { mounted = false; clearInterval(timer); knownPending.current = null; };
  }, [token]);
  if (loading) return <View style={styles.loading}><ActivityIndicator color={colors.accent} size="large" /><Text style={styles.loadingText}>正在載入管理介面</Text></View>;
  if (!token) return <LoginScreen />;
  const Current = screens[active];
  const selectScreen = (screen: ScreenKey) => { setActive(screen); if (screen === "orders") setUnreadOrders(0); };
  const handleSignOut = async () => {
    const pushToken = registeredPushToken.current;
    if (pushToken) {
      const platform = Platform.OS === "ios" ? "ios" : "android";
      try { await adminApi.unregisterPushToken(pushToken, platform); } catch { /* Signing out must still succeed if the API is temporarily unavailable. */ }
      registeredPushToken.current = null;
      pushNotificationsReady.current = false;
    }
    await signOut();
  };
  const navItems = navigation.map((item) => <Pressable accessibilityRole="button" key={item.key} onPress={() => selectScreen(item.key)} style={({ pressed }) => [styles.navItem, active === item.key && styles.navItemActive, pressed && styles.navItemPressed]}><Text style={[styles.navIcon, active === item.key && styles.navTextActive]}>{item.icon}</Text><Text style={[styles.navText, active === item.key && styles.navTextActive]}>{item.label}</Text>{item.key === "orders" && unreadOrders ? <View style={styles.badge}><Text style={styles.badgeText}>{unreadOrders > 99 ? "99+" : unreadOrders}</Text></View> : null}</Pressable>);
  return <SafeAreaView style={styles.safe}><StatusBar style="dark" /><View style={[styles.shell, !tablet && styles.shellCompact]}>
    {tablet ? <View style={styles.sidebar}><View style={styles.brand}><Text style={styles.brandMark}>O</Text><View><Text style={styles.brandTitle}>點餐管理</Text><Text style={styles.brandSub}>{APP_ENV.toUpperCase()} · TABLET CONSOLE</Text></View></View><View style={styles.nav}>{navItems}</View><Button label="登出" variant="secondary" onPress={() => void handleSignOut()} /></View> : <View style={styles.mobileHeader}><Text style={styles.brandTitle}>點餐管理</Text><Button label="登出" variant="ghost" small onPress={() => void handleSignOut()} /></View>}
    {!tablet ? <ScrollView horizontal contentContainerStyle={styles.mobileNav} showsHorizontalScrollIndicator={false}>{navItems}</ScrollView> : null}
    <View style={styles.content}><Current /></View>
  </View></SafeAreaView>;
}

export default function App() { return <SafeAreaProvider><AuthProvider><Shell /></AuthProvider></SafeAreaProvider>; }

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, backgroundColor: colors.background },
  loadingText: { color: colors.textMuted, fontSize: 14 },
  shell: { flex: 1, flexDirection: "row", backgroundColor: colors.background },
  shellCompact: { flexDirection: "column" },
  sidebar: { width: 220, padding: 18, gap: 24, borderRightWidth: 1, borderRightColor: colors.border, backgroundColor: colors.surface },
  brand: { flexDirection: "row", alignItems: "center", gap: 11 },
  brandMark: { width: 38, height: 38, borderRadius: 11, textAlign: "center", textAlignVertical: "center", color: "white", backgroundColor: colors.accent, fontSize: 20, fontWeight: "900" },
  brandTitle: { color: colors.text, fontSize: 18, fontWeight: "900" },
  brandSub: { marginTop: 2, color: colors.textMuted, fontSize: 9, letterSpacing: 1.3, fontWeight: "700" },
  nav: { flex: 1, gap: 5 },
  navItem: { minHeight: 46, paddingHorizontal: 13, borderRadius: 9, flexDirection: "row", alignItems: "center", gap: 12 },
  navItemActive: { backgroundColor: colors.accentSoft },
  navItemPressed: { opacity: 0.65 },
  navIcon: { width: 20, color: colors.textMuted, fontSize: 18, textAlign: "center", fontWeight: "700" },
  navText: { color: colors.textMuted, fontSize: 15, fontWeight: "700" },
  navTextActive: { color: colors.accent },
  badge: { minWidth: 21, height: 21, paddingHorizontal: 5, marginLeft: "auto", alignItems: "center", justifyContent: "center", borderRadius: 11, backgroundColor: colors.danger },
  badgeText: { color: "white", fontSize: 11, fontWeight: "900" },
  mobileHeader: { minHeight: 58, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface },
  mobileNav: { padding: 8, gap: 4, backgroundColor: colors.surface },
  content: { flex: 1 },
});
