# Render 測試部署

此專案在 Render 建議拆成四個資源：

- `line-order-system-db`: Render Postgres
- `line-order-system-api`: Express API Web Service
- `line-order-system-customer`: 顧客端 Static Site
- `line-order-system-admin`: 管理端 Static Site

## 使用 Blueprint 部署

1. 確認最新程式已推到 GitHub。
2. 到 Render Dashboard 建立 Blueprint，選擇此 repo。
3. Render 會讀取根目錄的 `render.yaml`。
4. 建立時補上 `sync: false` 的環境變數。

## 必填環境變數

API 服務：

- `ADMIN_INITIAL_PASSWORD`: 管理者密碼，例如測試時填入目前要使用的密碼
- `LINE_CHANNEL_ID`
- `LINE_CHANNEL_SECRET`
- `LINE_LIFF_ID`
- `LINE_MESSAGING_CHANNEL_ACCESS_TOKEN`
- `LINE_ORDER_NOTIFICATION_TO`: 可用逗號分隔多位通知對象

顧客端 Static Site：

- `VITE_LINE_LIFF_ID`

## 部署後需要確認

- API health check: `https://line-order-system-api.onrender.com/api/health`
- 顧客端: `https://line-order-system-customer.onrender.com`
- 管理端: `https://line-order-system-admin.onrender.com`

如果 Render 因服務名稱重複而產生不同網址，請同步修改：

- API 的 `CUSTOMER_WEB_URL`
- API 的 `ADMIN_WEB_URL`
- 顧客端與管理端的 `VITE_API_BASE_URL`
- LINE Developers LIFF Endpoint URL

## LINE LIFF 設定

Render URL 確認後，到 LINE Developers 將 LIFF Endpoint URL 設為顧客端網址，例如：

```text
https://line-order-system-customer.onrender.com
```

測試時可以先使用 Render 提供的 `onrender.com` 網址，不需要自備域名。
