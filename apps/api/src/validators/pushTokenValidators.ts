import { z } from "zod";

export const adminPushTokenSchema = z.object({
  token: z.string().regex(/^Expo(nent)?PushToken\[[^\]]+\]$/, "推播 Token 格式不正確"),
  platform: z.enum(["android", "ios"])
});
