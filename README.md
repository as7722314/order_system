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

## 測試

```bash
npm run test --workspace @line-order/api
```
