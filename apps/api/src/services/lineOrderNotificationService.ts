import { env } from "../config/env.js";

export type NewOrderNotification = {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  note?: string;
  items: Array<{
    productName: string;
    quantity: number;
    subtotal: number;
    flavors: string[];
    note?: string;
  }>;
};

function truncateMessage(value: string, maxLength = 4800): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 20)}\n...內容過長已省略`;
}

function formatOrderMessage(order: NewOrderNotification): string {
  const itemLines = order.items.map((item) => {
    const flavors = item.flavors.length > 0 ? `（${item.flavors.join("、")}）` : "";
    const note = item.note ? `\n  備註：${item.note}` : "";
    return `- ${item.productName}${flavors} x ${item.quantity} / NT$ ${item.subtotal}${note}`;
  });

  return truncateMessage([
    "【新訂單通知】",
    `訂單編號：${order.orderNumber}`,
    `客戶姓名：${order.customerName}`,
    `手機：${order.customerPhone}`,
    `總金額：NT$ ${order.totalAmount}`,
    order.note ? `訂單備註：${order.note}` : "",
    "",
    "訂購內容：",
    ...itemLines
  ].filter(Boolean).join("\n"));
}

function getNotificationTargets(): string[] {
  return env.LINE_ORDER_NOTIFICATION_TO
    .split(/[,;\s]+/)
    .map((target) => target.trim())
    .filter(Boolean);
}

async function pushLineMessage(target: string, text: string): Promise<void> {
  const response = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      to: target,
      messages: [{ type: "text", text }]
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`${target}: ${response.status} ${detail}`);
  }
}

export async function notifyNewOrder(order: NewOrderNotification): Promise<void> {
  if (env.LINE_ORDER_NOTIFICATION_ENABLED === "false") return;
  const targets = getNotificationTargets();
  if (!env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN || targets.length === 0) {
    console.warn("[line-order-notification] LINE Messaging API token or notification target is not configured; skipped.");
    return;
  }

  const message = formatOrderMessage(order);
  const results = await Promise.allSettled(targets.map((target) => pushLineMessage(target, message)));
  const failed = results
    .map((result, index) => ({ result, target: targets[index] }))
    .filter((entry): entry is { result: PromiseRejectedResult; target: string } => entry.result.status === "rejected");

  if (failed.length > 0) {
    throw new Error(`LINE Messaging API notification failed for ${failed.length}/${targets.length} target(s): ${failed.map((entry) => String(entry.result.reason)).join(" | ")}`);
  }
}


