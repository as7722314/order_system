# 點餐管理平板 App

以 Expo 57 / React Native 製作的 iOS、Android 跨平台管理 App，直接使用現有 `apps/api` REST API。

## 開發環境

- Node.js 22.13 以上（Expo SDK 57 的最低需求）
- Android Studio 模擬器、實體 Android 平板，或 iPad 上的 Expo Go
- 後端與平板必須能互相連線

## 設定 API

複製 `.env.example` 為 `.env.local`。未指定環境時一律安全地預設為 `local`：

```env
APP_ENV=local
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000/api
EXPO_PUBLIC_EAS_PROJECT_ID=你的-EAS-Project-ID
```

Android APK 必須使用明確的環境建置指令：

```bash
npm run build:android:local
npm run build:android:production
```

兩個指令會分別輸出到 `dist/order-system-admin-tablet-local-v1.0.0.apk` 與 `dist/order-system-admin-tablet-production-v1.0.0.apk`，並檢查 APK 內嵌環境與 API 網址完全一致。正式版只有在 `APP_ENV=production` 時才能連線正式 API。

## 關閉 App 後的新訂單推播

此 App 使用 Expo Push Service 與 Firebase Cloud Messaging。登入後會將平板的 Expo Push Token 註冊到後端；客人建立訂單時，後端會發送高優先級且有聲音的系統推播。

建置推播版 APK 前需完成一次：

1. 在 Firebase 建立 Android App，package name 使用 `com.orderSystem.admin`。
2. 將 Firebase 下載的 `google-services.json` 放到本目錄。
3. 在 Expo/EAS 建立專案，將 Project ID 寫入 `.env.local` 的 `EXPO_PUBLIC_EAS_PROJECT_ID`。
4. 將 Firebase FCM V1 service-account key 上傳至該 EAS 專案；私密金鑰不可提交至 Git。
5. 後端部署資料庫 migration，並確認 `EXPO_PUSH_NOTIFICATIONS_ENABLED=true`。

一般從最近使用清單滑掉 App 後仍可收到推播；若使用 Android 設定中的「強制停止」，必須重新開啟 App 後才能再次接收通知。

若要連接本機後端，請改成開發電腦的區網網址，例如 `http://192.168.1.107:3000/api`；實體平板不能使用 `localhost` 連到開發電腦。此變數只存 API 網址，不可放密碼或私鑰。

## 執行

```bash
npm install
npm start
```

接著掃描 QR code 在 Expo Go 開啟，或執行 `npm run android`。iOS 原生建置需要 macOS，開發階段可直接用 iPad 的 Expo Go。

## 檢查

```bash
npm run typecheck
npm test
npx expo export --platform android
```

## 後端串接

登入呼叫 `POST /api/admin/auth/login`，取得的 JWT 會透過 `expo-secure-store` 存入 iOS Keychain 或 Android Keystore。其餘管理 API 會自動加入 `Authorization: Bearer <token>`；遇到 401 時自動登出。

App 在前景執行時每 20 秒檢查待接訂單；發現新訂單會顯示原生提示與訂單未讀徽章。儀表板本身每 30 秒更新一次。
