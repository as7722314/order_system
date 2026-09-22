import { describe, expect, it } from "vitest";
import { ADMIN_ORDER_CHANNEL_ID, buildAdminOrderPushMessages } from "../src/services/adminPushNotificationPayload.js";

describe("admin push notifications", () => {
  it("builds an audible high-priority new-order notification for every tablet", () => {
    const messages = buildAdminOrderPushMessages(
      ["ExponentPushToken[first]", "ExponentPushToken[second]"],
      { orderNumber: "20260922-A1234", customerName: "王小明", totalAmount: 180 }
    );

    expect(messages).toHaveLength(2);
    expect(messages[0]).toMatchObject({
      to: "ExponentPushToken[first]",
      title: "收到新訂單",
      sound: "default",
      priority: "high",
      channelId: ADMIN_ORDER_CHANNEL_ID,
      data: { screen: "orders", orderNumber: "20260922-A1234" }
    });
    expect(messages[0].body).toContain("NT$ 180");
  });
});
