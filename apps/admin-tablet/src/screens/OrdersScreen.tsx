import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useActionFeedback } from "../feedback";
import { adminApi } from "../api";
import { OrderCard } from "../components/OrderCard";
import { Button, Card, Chip, Empty, ErrorNotice, Field, FormModal, Page, ui } from "../components/ui";
import { colors } from "../theme";
import type { Flavor, Order, OrderStatus, Product } from "../types";
import { errorMessage, money } from "../utils";

type Mode = "active" | "deleted";
type OnsiteLine = { localId: string; productId: string; quantity: number; flavorIds: string[] };
const newLine = (): OnsiteLine => ({ localId: `${Date.now()}-${Math.random()}`, productId: "", quantity: 1, flavorIds: [] });

export function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]); const [products, setProducts] = useState<Product[]>([]); const [flavors, setFlavors] = useState<Flavor[]>([]);
  const [mode, setMode] = useState<Mode>("active"); const [loading, setLoading] = useState(false); const [error, setError] = useState(""); const [expanded, setExpanded] = useState<string | null>(null);
  const [onsiteOpen, setOnsiteOpen] = useState(false); const [lines, setLines] = useState<OnsiteLine[]>([newLine()]); const [onsiteError, setOnsiteError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null); const [deleteReason, setDeleteReason] = useState("");
  const action = useActionFeedback((value) => { if (onsiteOpen) setOnsiteError(value); else setError(value); });
  const [activeAction, setActiveAction] = useState<{ id: string; kind: "status" | "cancel" | "restore" } | null>(null);
  const activeProducts = useMemo(() => products.filter((item) => item.isActive), [products]); const activeFlavors = useMemo(() => flavors.filter((item) => item.isActive), [flavors]);
  const load = useCallback(async (nextMode: Mode = mode) => { setLoading(true); setError(""); try { setOrders(await adminApi.listOrders({ deleted: nextMode, pageSize: 100 })); } catch (reason) { setError(errorMessage(reason, "讀取訂單失敗")); } finally { setLoading(false); } }, [mode]);
  const loadCatalog = useCallback(async () => { try { const [p, f] = await Promise.all([adminApi.listProducts(), adminApi.listFlavors()]); setProducts(p); setFlavors(f); } catch (reason) { setError(errorMessage(reason, "讀取商品資料失敗")); } }, []);
  useEffect(() => { void load(); }, [load]); useEffect(() => { void loadCatalog(); }, [loadCatalog]);

  const product = (id: string) => products.find((item) => item.id === id);
  const flavorOptions = (id: string) => { const links = product(id)?.productFlavors || []; return links.length ? links.map((link) => link.flavor).filter((item) => item.isActive) : activeFlavors; };
  const subtotal = (line: OnsiteLine) => { const selected = product(line.productId); if (!selected) return 0; const extra = flavorOptions(line.productId).filter((item) => line.flavorIds.includes(item.id)).reduce((sum, item) => sum + item.extraPrice, 0); return (selected.price + extra) * Math.max(1, line.quantity); };
  const total = lines.reduce((sum, line) => sum + subtotal(line), 0);
  const patchLine = (localId: string, patch: Partial<OnsiteLine>) => setLines(lines.map((line) => line.localId === localId ? { ...line, ...patch } : line));
  const toggleFlavor = (line: OnsiteLine, flavorId: string) => { if (line.flavorIds.includes(flavorId)) patchLine(line.localId, { flavorIds: line.flavorIds.filter((id) => id !== flavorId) }); else if (line.flavorIds.length < 2) patchLine(line.localId, { flavorIds: [...line.flavorIds, flavorId] }); else setOnsiteError("每個品項最多選擇 2 個口味"); };

  const runOrder = (order: Order | string, kind: "status" | "cancel" | "restore", work: () => Promise<void>, success: string) => {
    const id = typeof order === "string" ? order : order.id;
    if (action.busy) return; setActiveAction({ id, kind });
    void action.run(async () => { await work(); await load(); return id; }, { success, failure: "更新訂單失敗", highlight: (value) => value });
  };
  const changeStatus = (id: string, status: OrderStatus) => runOrder(id, "status", () => adminApi.updateOrderStatus(id, status), "訂單狀態已更新");
  const cancel = (order: Order) => Alert.alert("取消訂單", `確定取消「${order.orderNumber}」？`, [{ text: "返回", style: "cancel" }, { text: "確定取消", style: "destructive", onPress: () => runOrder(order, "cancel", () => adminApi.cancelOrder(order.id, "管理者取消"), "訂單已取消") }]);
  const remove = async () => {
    if (!deleteTarget) return;
    await action.run(async () => { await adminApi.deleteOrder(deleteTarget.id, deleteReason.trim() || undefined); setDeleteTarget(null); setDeleteReason(""); await load(); }, { success: "訂單已移至已刪除區", failure: "刪除訂單失敗" });
  };
  const restore = (order: Order) => Alert.alert("復原訂單", `確定復原「${order.orderNumber}」？`, [{ text: "返回", style: "cancel" }, { text: "復原", onPress: () => runOrder(order, "restore", () => adminApi.restoreOrder(order.id), "訂單已復原") }]);
  const openOnsite = () => { setLines([newLine()]); setOnsiteError(""); setOnsiteOpen(true); };
  const submitOnsite = async () => {
    const valid = lines.filter((line) => line.productId && line.quantity > 0);
    if (!valid.length) { setOnsiteError("請至少選擇一個商品"); return; }
    await action.run(async () => { const order = await adminApi.createOnsiteOrder({ items: valid.map(({ productId, quantity, flavorIds }) => ({ productId, quantity, flavorIds })) }); setOnsiteOpen(false); setMode("active"); await load("active"); return order; }, { success: (order) => `現場點餐已送出：${order.orderNumber}`, failure: "現場點餐失敗", highlight: (order) => order.id });
  };
  const orderCards = orders.map((order) => (
    <OrderCard
      key={order.id}
      order={order}
      interactive
      deleted={mode === "deleted"}
      busy={loading || action.busy}
      busyAction={action.busy && activeAction?.id === order.id ? activeAction.kind : undefined}
      expanded={expanded === order.id}
      onToggle={() => setExpanded(expanded === order.id ? null : order.id)}
      onStatus={(status) => void changeStatus(order.id, status)}
      onCancel={() => cancel(order)}
      onDelete={() => { setDeleteTarget(order); setDeleteReason(""); }}
      onRestore={() => restore(order)}
    />
  ));

  return <Page title="訂單" subtitle="處理線上訂單、現場點餐與已刪除訂單" refreshing={loading} onRefresh={() => void load()} action={<Button disabled={loading || action.busy} label="現場點餐" onPress={openOnsite} />}>
    <View style={ui.row}><Chip label="一般訂單" selected={mode === "active"} onPress={() => !action.busy && setMode("active")} /><Chip label="已刪除" selected={mode === "deleted"} onPress={() => !action.busy && setMode("deleted")} /></View>
    <ErrorNotice message={error} />
    {orders.length ? <View style={ui.gap}>{orderCards}</View> : <Empty text={mode === "deleted" ? "目前沒有已刪除訂單" : "目前沒有訂單"} />}

    <FormModal busy={action.busy} visible={Boolean(deleteTarget)} title="刪除訂單" subtitle={`訂單 ${deleteTarget?.orderNumber || ""} 將移到已刪除區，之後仍可復原。`} onClose={() => setDeleteTarget(null)}><ErrorNotice message={error} /><Field label="刪除原因（選填）" multiline value={deleteReason} onChangeText={setDeleteReason} /><View style={ui.actions}><Button label="返回" variant="secondary" onPress={() => setDeleteTarget(null)} /><Button label="確認刪除" variant="danger" loading={action.busy} onPress={() => void remove()} /></View></FormModal>

    <FormModal busy={action.busy} visible={onsiteOpen} title="現場點餐" subtitle="送出後直接建立製作中訂單" onClose={() => !loading && setOnsiteOpen(false)}>
      {lines.map((line, index) => <Card key={line.localId}><View style={ui.spread}><Text style={ui.title}>品項 {index + 1}</Text>{lines.length > 1 ? <Button label="移除" variant="ghost" small onPress={() => setLines(lines.filter((item) => item.localId !== line.localId))} /> : null}</View><Text style={ui.muted}>選擇商品</Text><View style={ui.row}>{activeProducts.map((item) => <Chip key={item.id} label={`${item.name} · ${money(item.price)}`} selected={line.productId === item.id} onPress={() => patchLine(line.localId, { productId: item.id, flavorIds: [] })} />)}</View>{line.productId ? <><View style={ui.spread}><Text style={ui.muted}>數量</Text><View style={ui.row}><Button label="−" variant="secondary" small onPress={() => patchLine(line.localId, { quantity: Math.max(1, line.quantity - 1) })} /><Text style={ui.strong}>{line.quantity}</Text><Button label="＋" variant="secondary" small onPress={() => patchLine(line.localId, { quantity: line.quantity + 1 })} /></View></View><Text style={ui.muted}>口味（最多 2 個）</Text><View style={ui.row}>{flavorOptions(line.productId).map((item) => <Chip key={item.id} label={`${item.name}${item.extraPrice ? ` +${item.extraPrice}` : ""}`} selected={line.flavorIds.includes(item.id)} onPress={() => toggleFlavor(line, item.id)} />)}</View><Text style={styles.subtotal}>小計 {money(subtotal(line))}</Text></> : null}</Card>)}
      <Button label="新增品項" variant="secondary" onPress={() => setLines([...lines, newLine()])} /><ErrorNotice message={onsiteError} /><View style={ui.spread}><Text style={styles.total}>總計 {money(total)}</Text><View style={ui.actions}><Button label="取消" variant="secondary" onPress={() => setOnsiteOpen(false)} /><Button label="送出現場點餐" loading={action.busy} onPress={() => void submitOnsite()} /></View></View>
    </FormModal>
  </Page>;
}

const styles = StyleSheet.create({ message: { color: colors.success, fontSize: 14, fontWeight: "700" }, subtotal: { color: colors.text, fontSize: 15, fontWeight: "700", textAlign: "right" }, total: { color: colors.text, fontSize: 22, fontWeight: "900" } });
