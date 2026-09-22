import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import type { Order } from "./types";

export const ORDER_CHANNEL_ID = "new-orders-v2";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function prepareOrderNotifications(): Promise<boolean> {
  if (Platform.OS === "web") return false;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(ORDER_CHANNEL_ID, {
      name: "新訂單",
      description: "收到新訂單時發出提示音與震動",
      importance: Notifications.AndroidImportance.MAX,
      sound: "default",
      vibrationPattern: [0, 250, 180, 250],
      lightColor: "#9a3412",
    });
  }

  const current = await Notifications.getPermissionsAsync();
  if (current.status === "granted") return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === "granted";
}

export async function registerForOrderPushNotifications(): Promise<string | null> {
  if (Platform.OS === "web" || !(await prepareOrderNotifications())) return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId
    ?? Constants.easConfig?.projectId
    ?? process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
  if (!projectId) {
    console.warn("[push-notifications] EAS project ID is not configured");
    return null;
  }

  try {
    return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  } catch (error) {
    console.warn("[push-notifications] failed to obtain an Expo push token", error);
    return null;
  }
}

export function subscribeToOrderNotificationResponses(onOpenOrders: () => void): () => void {
  const handleResponse = (response: Notifications.NotificationResponse | null) => {
    if (response?.notification.request.content.data?.screen === "orders") onOpenOrders();
  };

  handleResponse(Notifications.getLastNotificationResponse());
  const subscription = Notifications.addNotificationResponseReceivedListener(handleResponse);
  return () => subscription.remove();
}

export async function notifyNewOrders(orders: Order[]): Promise<boolean> {
  if (!orders.length || !(await prepareOrderNotifications())) return false;

  const latest = orders[0];
  await Notifications.scheduleNotificationAsync({
    content: {
      title: orders.length === 1 ? "收到新訂單" : `收到 ${orders.length} 筆新訂單`,
      body: `${latest.orderNumber} · ${latest.customerName} · NT$ ${latest.totalAmount.toLocaleString("zh-TW")}`,
      sound: "default",
      data: { screen: "orders", orderId: latest.id },
      color: "#9a3412",
    },
    trigger: Platform.OS === "android"
      ? {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 1,
          channelId: ORDER_CHANNEL_ID,
        }
      : null,
  });
  return true;
}
