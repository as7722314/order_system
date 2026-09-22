import { useCallback, useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { adminApi } from "../api";
import { OrderCard } from "../components/OrderCard";
import { Button, Card, Empty, ErrorNotice, Page, ui } from "../components/ui";
import { colors } from "../theme";
import type { Order, OrderStatus, Report, StoreStatus } from "../types";
import { errorMessage, formatDateTime, money, taipeiDate } from "../utils";

export function DashboardScreen() {
  const today = taipeiDate();
  const [report, setReport] = useState<Report>({ orderCount: 0, totalRevenue: 0, totalProductCost: 0, totalExpense: 0, netProfit: 0 });
  const [pending, setPending] = useState<Order[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [store, setStore] = useState<StoreStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [daily, todayOrders, pendingOrders, status] = await Promise.all([adminApi.dailyReport(today), adminApi.listOrders({ date: today, pageSize: 100 }), adminApi.listOrders({ status: "PENDING", pageSize: 100 }), adminApi.getStoreStatus()]);
      setReport(daily); setOrders(todayOrders); setPending(pendingOrders); setStore(status);
    } catch (reason) { setError(errorMessage(reason, "讀取儀表板失敗")); } finally { setLoading(false); }
  }, [today]);
  useEffect(() => { void load(); const timer = setInterval(() => void load(), 30000); return () => clearInterval(timer); }, [load]);

  const toggleStore = async () => {
    if (!store) return;
    setLoading(true); setError("");
    try { setStore(await adminApi.updateStoreStatus(!store.isOpen)); } catch (reason) { setError(errorMessage(reason, "更新營業狀態失敗")); } finally { setLoading(false); }
  };
  const changeStatus = async (id: string, status: OrderStatus) => { setLoading(true); try { await adminApi.updateOrderStatus(id, status); await load(); } catch (reason) { setError(errorMessage(reason, "更新訂單狀態失敗")); setLoading(false); } };
  const cancel = (order: Order) => Alert.alert("取消訂單", `確定取消「${order.orderNumber}」？`, [{ text: "返回", style: "cancel" }, { text: "確定取消", style: "destructive", onPress: async () => { try { await adminApi.cancelOrder(order.id, "管理者取消"); await load(); } catch (reason) { setError(errorMessage(reason, "取消訂單失敗")); } } }]);
  const remove = (order: Order) => Alert.alert("刪除訂單", `確定刪除「${order.orderNumber}」？訂單將移到已刪除區，之後仍可復原。`, [{ text: "返回", style: "cancel" }, { text: "確認刪除", style: "destructive", onPress: async () => { setLoading(true); try { await adminApi.deleteOrder(order.id, "從儀表板刪除"); await load(); } catch (reason) { setError(errorMessage(reason, "刪除訂單失敗")); setLoading(false); } } }]);

  const metrics = [{ label: "今日訂單", value: String(report.orderCount) }, { label: "待接單", value: String(pending.length) }, { label: "今日營收", value: money(report.totalRevenue) }, { label: "今日淨利", value: money(report.netProfit) }];
  return <Page title="儀表板" subtitle={`${today} · 每 30 秒自動更新`} refreshing={loading} onRefresh={() => void load()}>
    <Card style={[styles.store, { borderColor: store?.isOpen ? "#a7f3d0" : "#fecaca" }]}><View style={ui.spread}><View style={ui.gap}><Text style={ui.muted}>線上點餐狀態</Text><Text style={[styles.storeState, { color: store?.isOpen ? colors.success : colors.danger }]}>{store?.isOpen ? "營業中" : "暫停點餐"}</Text>{store ? <Text style={ui.muted}>最後更新：{formatDateTime(store.updatedAt)}</Text> : null}</View><Button label={store?.isOpen ? "暫停點餐" : "開始營業"} variant={store?.isOpen ? "danger" : "success"} disabled={loading || !store} onPress={() => void toggleStore()} /></View></Card>
    <View style={styles.metrics}>{metrics.map((metric) => <Card key={metric.label} style={styles.metric}><Text style={ui.muted}>{metric.label}</Text><Text style={styles.metricValue}>{metric.value}</Text></Card>)}</View>
    <ErrorNotice message={error} />
    <View style={ui.gap}><View style={ui.spread}><Text style={ui.sectionTitle}>待接單明細</Text><Text style={ui.muted}>{pending.length} 筆</Text></View>{pending.length ? pending.map((order) => <OrderCard key={order.id} order={order} interactive busy={loading} expanded={expanded === order.id} onToggle={() => setExpanded(expanded === order.id ? null : order.id)} onStatus={(status) => void changeStatus(order.id, status)} onCancel={() => cancel(order)} onDelete={() => remove(order)} />) : <Empty text="目前沒有待接單訂單" />}</View>
    <View style={ui.gap}><View style={ui.spread}><Text style={ui.sectionTitle}>今日訂單</Text><Text style={ui.muted}>{orders.length} 筆</Text></View>{orders.length ? orders.map((order) => <OrderCard key={order.id} order={order} expanded={expanded === order.id} onToggle={() => setExpanded(expanded === order.id ? null : order.id)} />) : <Empty text="今天尚無訂單" />}</View>
  </Page>;
}

const styles = StyleSheet.create({
  store: { padding: 20 },
  storeState: { fontSize: 25, fontWeight: "900" },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  metric: { flexGrow: 1, minWidth: 160 },
  metricValue: { color: colors.text, fontSize: 23, fontWeight: "800" },
});
