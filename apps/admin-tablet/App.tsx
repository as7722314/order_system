import { useEffect, useRef, useState, type ComponentType } from "react";
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "./src/auth";
import { adminApi } from "./src/api";
import { notifyNewOrders, prepareOrderNotifications, registerForOrderPushNotifications, subscribeToOrderNotificationResponses } from "./src/notifications";
import { AdminLayout, type ScreenKey } from "./src/components/AdminLayout";
import { CategoriesScreen } from "./src/screens/CategoriesScreen";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { ExpensesScreen } from "./src/screens/ExpensesScreen";
import { FlavorsScreen } from "./src/screens/FlavorsScreen";
import { LoginScreen } from "./src/screens/LoginScreen";
import { OrdersScreen } from "./src/screens/OrdersScreen";
import { ProductsScreen } from "./src/screens/ProductsScreen";
import { ReportsScreen } from "./src/screens/ReportsScreen";
import { colors } from "./src/theme";
import { FeedbackProvider, FeedbackToast, useFeedback } from "./src/feedback";

const screens: Record<ScreenKey, ComponentType> = { dashboard: DashboardScreen, orders: OrdersScreen, products: ProductsScreen, categories: CategoriesScreen, flavors: FlavorsScreen, expenses: ExpensesScreen, reports: ReportsScreen };

function Shell() {
  const { loading, token, signOut } = useAuth();
  const { clear } = useFeedback();
  useEffect(() => { if (!token) clear(); }, [token, clear]);
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
  return <AdminLayout active={active} unreadOrders={unreadOrders} onSelect={selectScreen} onSignOut={() => void handleSignOut()}><Current /></AdminLayout>;
}

export default function App() { return <SafeAreaProvider><FeedbackProvider><AuthProvider><Shell /><FeedbackToast /></AuthProvider></FeedbackProvider></SafeAreaProvider>; }

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, backgroundColor: colors.background },
  loadingText: { color: colors.textMuted, fontSize: 14 },
});
