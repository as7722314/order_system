export const ADMIN_ORDER_CHANNEL_ID = "new-orders-v2";

export type AdminPushOrder = {
  orderNumber: string;
  customerName: string;
  totalAmount: number;
};

export type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  sound: "default";
  priority: "high";
  channelId: string;
  ttl: number;
  data: { screen: "orders"; orderNumber: string };
};

export function buildAdminOrderPushMessages(tokens: string[], order: AdminPushOrder): ExpoPushMessage[] {
  return tokens.map((token) => ({
    to: token,
    title: "收到新訂單",
    body: `${order.orderNumber} · ${order.customerName} · NT$ ${order.totalAmount.toLocaleString("zh-TW")}`,
    sound: "default",
    priority: "high",
    channelId: ADMIN_ORDER_CHANNEL_ID,
    ttl: 3600,
    data: { screen: "orders", orderNumber: order.orderNumber }
  }));
}
