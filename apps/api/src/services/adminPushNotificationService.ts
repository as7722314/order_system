import { env } from "../config/env.js";
import { prisma } from "../utils/prisma.js";
import { buildAdminOrderPushMessages, type AdminPushOrder } from "./adminPushNotificationPayload.js";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

type ExpoPushTicket = {
  status: "ok" | "error";
  details?: { error?: string };
};

export async function notifyAdminPushSubscribers(order: AdminPushOrder): Promise<void> {
  if (env.EXPO_PUSH_NOTIFICATIONS_ENABLED !== "true") return;

  const registrations = await prisma.adminPushToken.findMany({
    select: { token: true }
  });
  if (!registrations.length) return;

  for (let offset = 0; offset < registrations.length; offset += 100) {
    const batch = registrations.slice(offset, offset + 100);
    const messages = buildAdminOrderPushMessages(batch.map(({ token }) => token), order);
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
      "Content-Type": "application/json"
    };
    if (env.EXPO_ACCESS_TOKEN) headers.Authorization = `Bearer ${env.EXPO_ACCESS_TOKEN}`;

    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(messages)
    });
    if (!response.ok) {
      throw new Error(`Expo Push API returned ${response.status}`);
    }

    const payload = await response.json() as { data?: ExpoPushTicket[] };
    const invalidTokens = batch
      .filter((_, index) => payload.data?.[index]?.details?.error === "DeviceNotRegistered")
      .map(({ token }) => token);
    if (invalidTokens.length) {
      await prisma.adminPushToken.deleteMany({ where: { token: { in: invalidTokens } } });
    }
  }
}
