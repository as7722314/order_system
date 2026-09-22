import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Order, OrderStatus } from "../types";
import { colors } from "../theme";
import { canCancel, formatDateTime, money, nextStatus, normalizeStatus, statusLabels } from "../utils";
import { Button, Card, Chip, Divider, ui } from "./ui";

const tone: Record<OrderStatus, "default" | "success" | "warning" | "danger" | "info"> = {
  PENDING: "warning", CONFIRMED: "info", PREPARING: "warning", READY: "info", COMPLETED: "success", CANCELLED: "danger",
};

export function OrderCard({ order, interactive, deleted, busy, expanded, onToggle, onStatus, onCancel, onDelete, onRestore }: {
  order: Order; interactive?: boolean; deleted?: boolean; busy?: boolean; expanded?: boolean; onToggle?: () => void;
  onStatus?: (status: OrderStatus) => void; onCancel?: () => void; onDelete?: () => void; onRestore?: () => void;
}) {
  const status = normalizeStatus(order.status);
  const action = nextStatus(status);
  return <Card>
    <Pressable onPress={onToggle} style={ui.spread}>
      <View style={styles.identity}><View style={ui.row}><Text style={ui.strong}>{order.orderNumber}</Text><Chip label={statusLabels[status]} tone={tone[status]} /></View><Text style={ui.muted}>{formatDateTime(order.createdAt)} · {order.customerName} · {order.customerPhone}</Text></View>
      <View style={styles.amount}><Text style={ui.strong}>{money(order.totalAmount)}</Text>{onToggle ? <Text style={ui.muted}>{expanded ? "收合明細 ▲" : "查看明細 ▼"}</Text> : null}</View>
    </Pressable>
    {deleted && order.deletedReason ? <Text style={styles.deletedReason}>刪除原因：{order.deletedReason}</Text> : null}
    {expanded ? <View style={styles.items}>{(order.items || []).map((item) => <View key={item.id} style={styles.item}><View style={ui.spread}><Text style={ui.title}>{item.productNameSnapshot} × {item.quantity}</Text><Text style={ui.title}>{money(item.subtotal)}</Text></View><Text style={ui.muted}>口味：{item.flavors.length ? item.flavors.map((value) => value.flavorNameSnapshot).join("、") : "未選口味"}</Text>{item.note ? <Text style={styles.note}>品項備註：{item.note}</Text> : null}</View>)}{order.note ? <Text style={styles.note}>訂單備註：{order.note}</Text> : null}</View> : null}
    {interactive ? <><Divider /><View style={ui.actions}>{deleted ? <Button label="復原訂單" variant="success" small disabled={busy} onPress={onRestore} /> : <>{action ? <Button label={action.label} small disabled={busy} onPress={() => onStatus?.(action.status)} /> : null}{canCancel(status) ? <Button label="取消" variant="danger" small disabled={busy} onPress={onCancel} /> : null}{onDelete ? <Button label="刪除" variant="secondary" small disabled={busy} onPress={onDelete} /> : null}</>}</View></> : null}
  </Card>;
}

const styles = StyleSheet.create({
  identity: { flex: 1, minWidth: 280, gap: 6 },
  amount: { alignItems: "flex-end", gap: 6 },
  items: { gap: 8, backgroundColor: colors.surfaceMuted, borderRadius: 10, padding: 10 },
  item: { gap: 5, padding: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  note: { color: colors.warning, fontSize: 13 },
  deletedReason: { color: colors.danger, fontSize: 13 },
});
