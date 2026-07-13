# LINE 點餐系統開發文件

## 1. 專案目標

建立一套可透過 LINE LIFF 使用的點餐系統，提供顧客點餐、訂單查詢，以及管理者維護商品、口味、訂單、成本與日／月結報表。

本系統第一版以單一店家為範圍，不包含多分店、庫存、原料配方、線上付款、優惠券與會員點數。

---

## 2. 技術棧

### 前端

- Vue 3
- TypeScript
- Vite
- Tailwind CSS
- Pinia
- Vue Router
- Axios
- LINE LIFF SDK

### 後端

- Node.js
- Express
- TypeScript
- PostgreSQL
- Prisma ORM
- Zod
- JWT
- bcrypt
- Helmet
- CORS
- Morgan 或 Pino

### 部署

- Docker
- Docker Compose
- Nginx
- PostgreSQL Container
- API Container
- Customer Web Container
- Admin Web Container

---

## 3. 專案結構

```text
line-order-system/
├─ apps/
│  ├─ customer-web/
│  │  ├─ src/
│  │  │  ├─ api/
│  │  │  ├─ assets/
│  │  │  ├─ components/
│  │  │  ├─ composables/
│  │  │  ├─ layouts/
│  │  │  ├─ router/
│  │  │  ├─ stores/
│  │  │  ├─ types/
│  │  │  ├─ utils/
│  │  │  └─ views/
│  │  ├─ Dockerfile
│  │  └─ package.json
│  │
│  ├─ admin-web/
│  │  ├─ src/
│  │  │  ├─ api/
│  │  │  ├─ assets/
│  │  │  ├─ components/
│  │  │  ├─ layouts/
│  │  │  ├─ router/
│  │  │  ├─ stores/
│  │  │  ├─ types/
│  │  │  ├─ utils/
│  │  │  └─ views/
│  │  ├─ Dockerfile
│  │  └─ package.json
│  │
│  └─ api/
│     ├─ prisma/
│     │  ├─ schema.prisma
│     │  ├─ migrations/
│     │  └─ seed.ts
│     ├─ src/
│     │  ├─ config/
│     │  ├─ controllers/
│     │  ├─ middlewares/
│     │  ├─ repositories/
│     │  ├─ routes/
│     │  ├─ services/
│     │  ├─ types/
│     │  ├─ utils/
│     │  ├─ validators/
│     │  ├─ app.ts
│     │  └─ server.ts
│     ├─ Dockerfile
│     └─ package.json
│
├─ nginx/
│  └─ nginx.conf
├─ docker-compose.yml
├─ .env.example
├─ README.md
└─ DEVELOPMENT.md
```

---

## 4. 系統角色

### CUSTOMER

顧客可以：

- 透過 LINE LIFF 登入
- 瀏覽商品分類
- 瀏覽商品
- 選擇商品數量
- 每項商品最多選擇兩個口味
- 填寫商品備註
- 加入購物車
- 建立訂單
- 查看自己的訂單
- 使用訂單編號與手機末三碼查詢訂單

顧客不可：

- 修改已送出的訂單
- 取消訂單
- 修改訂單狀態
- 查看其他顧客的訂單

### ADMIN

管理者可以：

- 登入管理後台
- 維護商品分類
- 維護商品
- 維護口味
- 設定商品可用口味
- 查看所有訂單
- 修改訂單狀態
- 取消訂單
- 輸入成本名稱與費用
- 修改成本
- 刪除成本
- 查看日結報表
- 查看月結報表

---

## 5. 功能需求

## 5.1 商品分類

欄位：

- 名稱
- 顯示排序
- 是否啟用
- 建立時間
- 更新時間

規則：

- 停用分類後，顧客端不可顯示。
- 分類停用不應刪除歷史資料。
- 有商品關聯的分類不可直接刪除，僅可停用。

---

## 5.2 商品

欄位：

- 商品分類
- 商品名稱
- 商品說明
- 商品圖片 URL
- 商品售價
- 顯示排序
- 是否啟用
- 建立時間
- 更新時間

規則：

- 金額使用整數儲存，單位為新台幣元。
- 商品停用後不得建立新訂單。
- 歷史訂單需保留商品名稱與價格快照。
- 商品圖片第一版可使用外部 URL 或物件儲存 URL。

---

## 5.3 口味

欄位：

- 口味名稱
- 加價金額
- 顯示排序
- 是否啟用
- 建立時間
- 更新時間

規則：

- 一個商品可以關聯多個口味。
- 每個訂單品項最多選擇兩個口味。
- 口味可以不選。
- 同一個口味不可重複選擇。
- 停用口味後不得出現在新訂單中。
- 歷史訂單保留口味名稱與加價快照。

---

## 5.4 購物車

購物車資料可先儲存在前端 Pinia 與 localStorage。

每個購物車品項包含：

- 商品 ID
- 商品名稱
- 商品單價
- 數量
- 已選口味
- 口味加價
- 備註
- 小計

小計算法：

```text
品項小計 = (商品單價 + 所選口味加價總額) × 數量
```

訂單總額：

```text
訂單總額 = 所有品項小計加總
```

後端必須重新從資料庫讀取價格並重新計算，不可直接信任前端金額。

---

## 5.5 訂單

### 訂單狀態

```text
PENDING
CONFIRMED
PREPARING
READY
COMPLETED
CANCELLED
```

狀態中文：

```text
PENDING       待接單
CONFIRMED     已接單
PREPARING     製作中
READY         可取餐
COMPLETED     已完成
CANCELLED     已取消
```

### 建立訂單欄位

- 顧客姓名
- 顧客電話
- 預計取餐時間
- 訂單備註
- 商品明細

### 訂單編號

不可只使用自增流水號。

建議格式：

```text
YYYYMMDD-XXXXX
```

例如：

```text
20260711-A8K3Q
```

其中 `XXXXX` 為隨機大寫英數字元。

資料庫對 `order_number` 建立唯一索引。

### 建立訂單規則

後端需驗證：

1. 使用者已登入。
2. 至少有一個商品。
3. 商品存在且啟用。
4. 商品數量至少為 1。
5. 每個品項最多選擇兩個口味。
6. 不可選擇重複口味。
7. 口味存在且啟用。
8. 口味必須屬於該商品。
9. 商品價格由資料庫讀取。
10. 口味加價由資料庫讀取。
11. 總額由後端重新計算。
12. 訂單、訂單明細、口味明細必須在同一個 PostgreSQL Transaction 中建立。

### 訂單狀態轉換

允許：

```text
PENDING -> CONFIRMED
PENDING -> CANCELLED

CONFIRMED -> PREPARING
CONFIRMED -> CANCELLED

PREPARING -> READY
PREPARING -> CANCELLED

READY -> COMPLETED
READY -> CANCELLED
```

不允許：

- COMPLETED 再修改為其他狀態。
- CANCELLED 再修改為其他狀態。
- 顧客修改任何訂單狀態。

---

## 5.6 取消訂單

取消訂單功能僅限管理者。

取消訂單必須記錄：

- 取消原因
- 取消時間
- 取消管理者 ID

取消訂單不可刪除。

取消後狀態為：

```text
CANCELLED
```

取消訂單不納入營業額。

---

## 5.7 訂單查詢

### 已登入查詢

顧客可查詢自己的歷史訂單：

```http
GET /api/orders/my
```

### 訂單編號查詢

查詢條件：

- 訂單編號
- 手機末三碼

API：

```http
POST /api/orders/lookup
```

Request：

```json
{
  "orderNumber": "20260711-A8K3Q",
  "phoneLast3": "678"
}
```

查詢成功回傳：

- 訂單編號
- 建立時間
- 顧客姓名
- 商品明細
- 口味
- 數量
- 備註
- 訂單總額
- 預計取餐時間
- 訂單狀態
- 取消原因

不可回傳完整電話號碼。

---

## 5.8 成本管理

成本不綁定商品。

欄位：

- 成本日期
- 成本名稱
- 成本金額
- 備註
- 建立者
- 建立時間
- 更新時間

規則：

- 成本名稱由管理者自由輸入。
- 成本金額必須大於 0。
- 成本日期為報表歸屬日期。
- 管理者可新增、修改、刪除成本。
- 刪除成本建議使用軟刪除。
- 報表只統計未刪除成本。

---

## 5.9 日結與月結

### 營業額

只統計狀態為 `COMPLETED` 的訂單。

```text
總營業額 = COMPLETED 訂單 total_amount 加總
```

### 成本

```text
總成本 = 指定日期區間內 expenses.amount 加總
```

### 淨利

```text
淨利 = 總營業額 - 總成本
```

### 日結

依指定日期查詢：

```http
GET /api/admin/reports/daily?date=2026-07-11
```

回傳：

```json
{
  "date": "2026-07-11",
  "orderCount": 35,
  "totalRevenue": 10000,
  "totalExpense": 4500,
  "netProfit": 5500
}
```

### 月結

依指定月份查詢：

```http
GET /api/admin/reports/monthly?month=2026-07
```

回傳：

```json
{
  "month": "2026-07",
  "orderCount": 850,
  "totalRevenue": 280000,
  "totalExpense": 125000,
  "netProfit": 155000
}
```

月結需另外回傳每日明細：

```json
{
  "daily": [
    {
      "date": "2026-07-01",
      "revenue": 10000,
      "expense": 3500,
      "netProfit": 6500
    }
  ]
}
```

時區統一使用：

```text
Asia/Taipei
```

資料庫時間欄位使用 UTC，查詢日／月報表時轉換為台北時區。

---

## 6. Prisma 資料模型

```prisma
enum UserRole {
  CUSTOMER
  ADMIN
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PREPARING
  READY
  COMPLETED
  CANCELLED
}

model User {
  id          String    @id @default(uuid())
  lineUserId  String?   @unique @map("line_user_id")
  displayName String?   @map("display_name")
  phone       String?
  role        UserRole  @default(CUSTOMER)
  passwordHash String?  @map("password_hash")
  isActive    Boolean   @default(true) @map("is_active")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  orders            Order[]
  createdExpenses   Expense[] @relation("ExpenseCreatedBy")
  cancelledOrders   Order[]   @relation("OrderCancelledBy")

  @@map("users")
}

model ProductCategory {
  id        String    @id @default(uuid())
  name      String
  sortOrder Int       @default(0) @map("sort_order")
  isActive  Boolean   @default(true) @map("is_active")
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")

  products Product[]

  @@map("product_categories")
}

model Product {
  id          String   @id @default(uuid())
  categoryId  String   @map("category_id")
  name        String
  description String?
  imageUrl    String?  @map("image_url")
  price       Int
  sortOrder   Int      @default(0) @map("sort_order")
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  category       ProductCategory @relation(fields: [categoryId], references: [id])
  productFlavors ProductFlavor[]
  orderItems     OrderItem[]

  @@index([categoryId])
  @@map("products")
}

model Flavor {
  id         String   @id @default(uuid())
  name       String
  extraPrice Int      @default(0) @map("extra_price")
  sortOrder  Int      @default(0) @map("sort_order")
  isActive   Boolean  @default(true) @map("is_active")
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  productFlavors  ProductFlavor[]
  orderItemFlavors OrderItemFlavor[]

  @@map("flavors")
}

model ProductFlavor {
  productId String @map("product_id")
  flavorId  String @map("flavor_id")

  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  flavor  Flavor  @relation(fields: [flavorId], references: [id], onDelete: Cascade)

  @@id([productId, flavorId])
  @@map("product_flavors")
}

model Order {
  id             String      @id @default(uuid())
  orderNumber    String      @unique @map("order_number")
  userId         String?     @map("user_id")
  customerName   String      @map("customer_name")
  customerPhone  String      @map("customer_phone")
  pickupTime     DateTime?   @map("pickup_time")
  status         OrderStatus @default(PENDING)
  subtotal       Int
  flavorExtraAmount Int      @default(0) @map("flavor_extra_amount")
  totalAmount    Int         @map("total_amount")
  note           String?
  cancelReason   String?     @map("cancel_reason")
  cancelledById  String?     @map("cancelled_by_id")
  cancelledAt    DateTime?   @map("cancelled_at")
  completedAt    DateTime?   @map("completed_at")
  createdAt      DateTime    @default(now()) @map("created_at")
  updatedAt      DateTime    @updatedAt @map("updated_at")

  user        User?       @relation(fields: [userId], references: [id])
  cancelledBy User?       @relation("OrderCancelledBy", fields: [cancelledById], references: [id])
  items       OrderItem[]

  @@index([userId])
  @@index([status])
  @@index([createdAt])
  @@index([completedAt])
  @@map("orders")
}

model OrderItem {
  id                  String   @id @default(uuid())
  orderId             String   @map("order_id")
  productId           String?  @map("product_id")
  productNameSnapshot String   @map("product_name_snapshot")
  quantity            Int
  unitPrice           Int      @map("unit_price")
  flavorExtraAmount   Int      @default(0) @map("flavor_extra_amount")
  subtotal            Int
  note                String?
  createdAt           DateTime @default(now()) @map("created_at")

  order   Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product Product? @relation(fields: [productId], references: [id])
  flavors OrderItemFlavor[]

  @@index([orderId])
  @@map("order_items")
}

model OrderItemFlavor {
  id                 String @id @default(uuid())
  orderItemId        String @map("order_item_id")
  flavorId           String? @map("flavor_id")
  flavorNameSnapshot String @map("flavor_name_snapshot")
  extraPriceSnapshot Int    @map("extra_price_snapshot")

  orderItem OrderItem @relation(fields: [orderItemId], references: [id], onDelete: Cascade)
  flavor    Flavor?   @relation(fields: [flavorId], references: [id])

  @@index([orderItemId])
  @@map("order_item_flavors")
}

model Expense {
  id          String    @id @default(uuid())
  expenseDate DateTime  @map("expense_date") @db.Date
  name        String
  amount      Int
  note        String?
  createdById String    @map("created_by_id")
  deletedAt   DateTime? @map("deleted_at")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  createdBy User @relation("ExpenseCreatedBy", fields: [createdById], references: [id])

  @@index([expenseDate])
  @@index([deletedAt])
  @@map("expenses")
}
```

---

## 7. API 規格

## 7.1 認證

### LINE 登入

```http
POST /api/auth/line
```

Request：

```json
{
  "idToken": "LINE_ID_TOKEN"
}
```

後端需向 LINE 驗證 ID Token，不可直接相信前端傳入的 LINE User ID。

Response：

```json
{
  "accessToken": "SYSTEM_JWT",
  "user": {
    "id": "uuid",
    "displayName": "王小明",
    "role": "CUSTOMER"
  }
}
```

### 管理者登入

```http
POST /api/admin/auth/login
```

Request：

```json
{
  "account": "admin",
  "password": "password"
}
```

Response：

```json
{
  "accessToken": "SYSTEM_JWT",
  "user": {
    "id": "uuid",
    "displayName": "管理者",
    "role": "ADMIN"
  }
}
```

---

## 7.2 公開商品 API

```http
GET /api/categories
GET /api/products
GET /api/products/:id
```

查詢商品列表參數：

```text
categoryId
keyword
```

只回傳啟用中的分類、商品與口味。

---

## 7.3 顧客訂單 API

```http
POST /api/orders
GET  /api/orders/my
GET  /api/orders/:orderNumber
POST /api/orders/lookup
```

建立訂單 Request：

```json
{
  "customerName": "王小明",
  "customerPhone": "0912345678",
  "pickupTime": "2026-07-11T18:30:00+08:00",
  "note": "到場再製作",
  "items": [
    {
      "productId": "product-uuid",
      "quantity": 2,
      "flavorIds": ["flavor-uuid-1", "flavor-uuid-2"],
      "note": "不要太甜"
    }
  ]
}
```

Response：

```json
{
  "orderNumber": "20260711-A8K3Q",
  "status": "PENDING",
  "totalAmount": 150
}
```

---

## 7.4 管理者商品 API

```http
GET    /api/admin/categories
POST   /api/admin/categories
PUT    /api/admin/categories/:id
PATCH  /api/admin/categories/:id/status

GET    /api/admin/products
POST   /api/admin/products
PUT    /api/admin/products/:id
PATCH  /api/admin/products/:id/status

GET    /api/admin/flavors
POST   /api/admin/flavors
PUT    /api/admin/flavors/:id
PATCH  /api/admin/flavors/:id/status

PUT    /api/admin/products/:id/flavors
```

設定商品口味 Request：

```json
{
  "flavorIds": [
    "flavor-uuid-1",
    "flavor-uuid-2"
  ]
}
```

---

## 7.5 管理者訂單 API

```http
GET   /api/admin/orders
GET   /api/admin/orders/:id
PATCH /api/admin/orders/:id/status
POST  /api/admin/orders/:id/cancel
```

查詢參數：

```text
status
date
keyword
page
pageSize
```

修改狀態 Request：

```json
{
  "status": "PREPARING"
}
```

取消 Request：

```json
{
  "reason": "商品售完"
}
```

---

## 7.6 成本 API

```http
GET    /api/admin/expenses
POST   /api/admin/expenses
PUT    /api/admin/expenses/:id
DELETE /api/admin/expenses/:id
```

新增成本 Request：

```json
{
  "expenseDate": "2026-07-11",
  "name": "購買雞蛋",
  "amount": 1200,
  "note": "市場採購"
}
```

---

## 7.7 報表 API

```http
GET /api/admin/reports/daily?date=2026-07-11
GET /api/admin/reports/monthly?month=2026-07
```

---

## 8. API 回傳格式

成功：

```json
{
  "success": true,
  "data": {}
}
```

失敗：

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "輸入資料不正確",
    "details": []
  }
}
```

常用錯誤代碼：

```text
UNAUTHORIZED
FORBIDDEN
VALIDATION_ERROR
RESOURCE_NOT_FOUND
PRODUCT_INACTIVE
FLAVOR_INACTIVE
INVALID_FLAVOR_SELECTION
INVALID_ORDER_STATUS_TRANSITION
ORDER_ALREADY_CANCELLED
ORDER_ALREADY_COMPLETED
DUPLICATE_ORDER_NUMBER
INTERNAL_SERVER_ERROR
```

---

## 9. 前端頁面

## 9.1 顧客端

```text
/
├─ 首頁／商品分類
├─ 商品列表
├─ 商品詳細與口味選擇
├─ 購物車
├─ 訂單確認
├─ 訂單完成
├─ 我的訂單
├─ 訂單詳細
└─ 訂單編號查詢
```

### 顧客端必要元件

- ProductCard
- ProductModal
- FlavorSelector
- QuantitySelector
- CartItem
- CartSummary
- OrderStatusBadge
- LoadingOverlay
- ConfirmDialog
- EmptyState
- Toast

### 口味選擇互動

- 使用 checkbox。
- 顯示 `已選擇 1 / 2`。
- 選滿兩個後，其餘未選口味 disabled。
- 再取消其中一個後恢復可選。
- 送出前再次驗證不超過兩個。

---

## 9.2 管理後台

```text
/admin/login
/admin/dashboard
/admin/categories
/admin/products
/admin/flavors
/admin/orders
/admin/orders/:id
/admin/expenses
/admin/reports/daily
/admin/reports/monthly
```

### 儀表板

顯示：

- 今日訂單數
- 待接單數
- 製作中數
- 今日已完成營業額
- 今日總成本
- 今日淨利

---

## 10. Pinia Store

顧客端：

```text
authStore
productStore
cartStore
orderStore
```

管理後台：

```text
adminAuthStore
categoryStore
productStore
flavorStore
adminOrderStore
expenseStore
reportStore
```

---

## 11. 安全性要求

- 所有管理 API 必須驗證 ADMIN 角色。
- 顧客只能查看自己的訂單。
- 訂單編號查詢需搭配手機末三碼。
- 密碼使用 bcrypt 雜湊。
- JWT Secret 不得寫死。
- LINE Channel Secret、LIFF ID 與 Channel ID 使用環境變數。
- 使用 Helmet。
- CORS 限制允許來源。
- API 加上 rate limit。
- 所有輸入使用 Zod 驗證。
- Prisma Query 不可拼接原始 SQL。
- 不可將完整錯誤堆疊回傳到正式環境。
- 電話號碼不得寫入一般 application log。
- `.env` 不可提交至 Git。

---

## 12. 環境變數

`.env.example`

```env
NODE_ENV=development
PORT=3000

DATABASE_URL=postgresql://app:password@postgres:5432/line_order

JWT_SECRET=change_me
JWT_EXPIRES_IN=7d

LINE_CHANNEL_ID=
LINE_CHANNEL_SECRET=
LINE_LIFF_ID=

ADMIN_ACCOUNT=admin
ADMIN_INITIAL_PASSWORD=change_me

CUSTOMER_WEB_URL=http://localhost:5173
ADMIN_WEB_URL=http://localhost:5174
API_BASE_URL=http://localhost:3000

TZ=Asia/Taipei
```

---

## 13. Docker Compose

```yaml
services:
  customer-web:
    build:
      context: ./apps/customer-web
    restart: unless-stopped
    depends_on:
      - api

  admin-web:
    build:
      context: ./apps/admin-web
    restart: unless-stopped
    depends_on:
      - api

  api:
    build:
      context: ./apps/api
    restart: unless-stopped
    env_file:
      - .env
    depends_on:
      postgres:
        condition: service_healthy

  postgres:
    image: postgres:17-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: line_order
      POSTGRES_USER: app
      POSTGRES_PASSWORD: password
      TZ: Asia/Taipei
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d line_order"]
      interval: 10s
      timeout: 5s
      retries: 5

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - customer-web
      - admin-web
      - api

volumes:
  postgres_data:
```

正式環境不可在 Compose 中直接寫明文密碼，應改用 `.env` 或 Docker Secret。

---

## 14. Nginx 路由

建議：

```text
https://order.example.com/        -> customer-web
https://order.example.com/admin/  -> admin-web
https://order.example.com/api/    -> api
```

Nginx 需處理：

- HTTPS
- Reverse Proxy
- SPA fallback
- 靜態檔案 cache
- API request body size
- Web security headers

---

## 15. 種子資料

初始 seed：

- 建立 ADMIN 使用者。
- 建立至少一個商品分類。
- 建立測試商品。
- 建立測試口味。

管理者初始密碼只能在第一次部署時使用，登入後應要求修改。

---

## 16. 測試要求

### 後端單元測試

至少測試：

- 訂單金額計算
- 口味最多兩個
- 重複口味驗證
- 商品停用驗證
- 口味停用驗證
- 商品與口味關聯驗證
- 訂單狀態轉換
- 取消訂單權限
- 日結計算
- 月結計算

### API 整合測試

至少測試：

- 建立訂單成功
- 建立空訂單失敗
- 選三個口味失敗
- 選擇不屬於商品的口味失敗
- 顧客取消訂單失敗
- 管理者取消訂單成功
- 訂單編號查詢成功
- 手機末三碼錯誤失敗
- CANCELLED 不納入營業額
- COMPLETED 納入營業額

---

## 17. 開發順序

### Phase 1：基礎建置

1. 建立 monorepo。
2. 建立 Vue 顧客端。
3. 建立 Vue 管理後台。
4. 建立 Express API。
5. 建立 PostgreSQL。
6. 建立 Prisma schema。
7. 建立 Docker Compose。
8. 建立環境變數。

### Phase 2：管理後台基礎

1. 管理者登入。
2. 商品分類 CRUD。
3. 商品 CRUD。
4. 口味 CRUD。
5. 商品與口味關聯。

### Phase 3：顧客點餐

1. LINE LIFF 初始化。
2. LINE Login。
3. 商品分類與列表。
4. 商品詳細。
5. 最多兩個口味。
6. 購物車。
7. 建立訂單。
8. 訂單完成頁。

### Phase 4：訂單管理

1. 管理訂單列表。
2. 管理訂單詳細。
3. 修改訂單狀態。
4. 管理者取消訂單。
5. 顧客我的訂單。
6. 訂單編號查詢。

### Phase 5：成本與報表

1. 成本 CRUD。
2. 日結 API。
3. 月結 API。
4. 管理儀表板。
5. 日結頁面。
6. 月結頁面。

### Phase 6：品質與部署

1. 測試。
2. 權限檢查。
3. Docker production build。
4. Nginx。
5. HTTPS。
6. Log 與錯誤處理。
7. 備份與還原文件。

---

## 18. 驗收條件

### 商品

- 管理者可新增、修改、停用商品。
- 停用商品不出現在顧客端。
- 商品可設定多個口味。

### 點餐

- 顧客可選擇商品與數量。
- 每個品項最多選擇兩個口味。
- 前端與後端都有限制。
- 後端重新計算金額。
- 建立訂單後回傳唯一訂單編號。

### 訂單

- 顧客可查看自己的訂單。
- 顧客可用訂單編號與手機末三碼查詢。
- 顧客不可取消訂單。
- 管理者可取消訂單。
- 取消訂單保留取消原因與操作人。
- 訂單狀態只能依允許流程變更。

### 成本

- 管理者可自由輸入成本名稱。
- 管理者可輸入成本金額。
- 管理者可修改與刪除成本。
- 成本不綁定商品。

### 報表

- 日結顯示當日完成訂單營業額。
- 日結顯示當日成本。
- 日結淨利等於營業額減成本。
- 月結計算指定月份。
- CANCELLED 訂單不納入營業額。
- 非 COMPLETED 訂單不納入營業額。

### 部署

- 所有服務可由 Docker Compose 啟動。
- PostgreSQL 資料使用 Volume 保存。
- Nginx 可正確代理前端與 API。
- 正式環境使用 HTTPS。

---

## 19. Codex 執行指示

Codex 開發時請遵守：

1. 先閱讀本文件，不要自行加入未定義的複雜功能。
2. 使用 TypeScript strict mode。
3. 前後端不得使用 `any`，除非有明確理由。
4. 所有 API 輸入使用 Zod 驗證。
5. 所有金額使用整數。
6. 所有時間欄位使用 UTC 儲存。
7. 報表依 Asia/Taipei 計算日期區間。
8. 建立訂單必須使用資料庫 Transaction。
9. 不信任前端傳入的售價與加價。
10. 不可讓顧客呼叫取消訂單 API。
11. 不可硬刪除訂單。
12. 成本刪除使用軟刪除。
13. 每完成一個 Phase，先執行 lint、typecheck、test。
14. 提交程式碼前確認 Docker Compose 可正常啟動。
15. 所有新增環境變數同步更新 `.env.example`。
16. API、資料模型或狀態流程異動時，同步更新本文件。
