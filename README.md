# LINE 點餐系統

依 `DEVELOPMENT.md` 建立的第一版 monorepo，包含顧客 LIFF 前端、管理後台、Express API、Prisma/PostgreSQL、Docker Compose 與 Nginx。

## 專案結構

```text
apps/api            Express + TypeScript + Prisma
apps/customer-web   Vue 3 顧客端
apps/admin-web      Vue 3 管理後台
nginx               Nginx reverse proxy 與 SPA fallback
```

## 本機開發

```bash
cp .env.example .env
npm install
npm run prisma:generate --workspace @line-order/api
npm run dev --workspace @line-order/api
npm run dev --workspace @line-order/customer-web
npm run dev --workspace @line-order/admin-web
```

Web 環境由 Vite mode 明確區分：`.env.development` 固定使用本地 `/api` proxy，`.env.production` 才使用正式 API。建議使用下列明確指令：

```bash
npm run dev:local --workspace @line-order/customer-web
npm run dev:local --workspace @line-order/admin-web
npm run build:production --workspace @line-order/customer-web
npm run build:production --workspace @line-order/admin-web
```

若 development mode 被設定成正式 API，建置與啟動會直接中止，避免本機操作正式資料。平板 App 的環境設定與 APK 指令請見 `apps/admin-tablet/README.md`。

本地顧客 Web 的 `.env.development` 會設定 `VITE_DEV_BYPASS_AUTH=true`，方便只預覽與調整手機介面；production mode 禁止啟用此參數，正式環境仍必須完成 LINE 登入。

預設入口：

- 顧客端：`http://localhost:5173`
- 管理後台：`http://localhost:5174/admin/`
- API：`http://localhost:3000/api/health`

## Docker

```bash
cp .env.example .env
docker compose up --build
```

Nginx 入口：

- 顧客端：`http://localhost/`
- 管理後台：`http://localhost/admin/`
- API：`http://localhost/api/health`

首次部署後執行 migration 與 seed：

```bash
docker compose exec api npx prisma migrate deploy
docker compose exec api npm run prisma:seed
```

## 已涵蓋

- Zod 驗證所有主要 API 輸入
- JWT 管理者/顧客權限
- LINE ID token 後端驗證入口
- 商品分類、商品、口味管理
- 商品與口味關聯 API
- 後端以資料庫價格重新計算訂單金額
- 訂單建立使用 PostgreSQL transaction
- 訂單狀態轉換與管理者取消訂單
- 成本軟刪除
- 日結/月結依 Asia/Taipei 日期區間統計
- 顧客端商品、口味、購物車、下單、查詢頁
- 管理後台登入、CRUD、訂單、成本、報表頁

## 營業額與成本報表

目前日結、月結與儀表板只顯示已完成訂單營業額及成本管理中登錄的成本合計，不計算或回傳淨利。商品新增、編輯及列表已移除商品成本，新增訂單也不再擷取商品成本快照。

既有資料庫的 `products.cost`、`order_items.unit_cost_snapshot` 保留作歷史資料，不再供設定與報表使用；這次調整不需新增 migration，也不會清除既有成本紀錄。商品 API 省略 `cost` 欄位；舊版客戶端傳入的 `cost` 會被忽略。報表 API 移除 `netProfit`、`totalProductCost` 及每日明細的 `netProfit`、`productCost`，更新 API 時需同步更新管理網頁與平板 App。

## 測試指令

部署時的 seed 會保留既有管理員密碼及顯示名稱；已有商品時不再重寫預設菜單、售價與口味關聯。

```bash
npm run test --workspace @line-order/api
```
