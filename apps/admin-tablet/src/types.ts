export type ApiResponse<T> = { success: boolean; data: T; message?: string };

export type Category = { id: string; name: string; sortOrder: number; isActive: boolean };
export type Flavor = { id: string; name: string; extraPrice: number; sortOrder: number; isActive: boolean };
export type ProductFlavor = { flavorId: string; flavor: Flavor };
export type Product = {
  id: string;
  categoryId?: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  price: number;
  cost: number;
  sortOrder: number;
  isActive: boolean;
  productFlavors?: ProductFlavor[];
};

export type OrderStatus = "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED";
export type OrderItemFlavor = { id: string; flavorNameSnapshot: string; extraPriceSnapshot: number };
export type OrderItem = {
  id: string;
  productNameSnapshot: string;
  quantity: number;
  unitPrice: number;
  unitCostSnapshot: number;
  flavorExtraAmount: number;
  subtotal: number;
  note?: string | null;
  flavors: OrderItemFlavor[];
};
export type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  status: OrderStatus | Lowercase<OrderStatus>;
  totalAmount: number;
  note?: string | null;
  deletedReason?: string | null;
  deletedAt?: string | null;
  createdAt: string;
  items?: OrderItem[];
};

export type OnsiteOrderPayload = { items: { productId: string; quantity: number; flavorIds: string[] }[] };
export type Expense = { id: string; expenseDate: string; category: string; name: string; amount: number; note?: string | null };
export type Report = { orderCount: number; totalRevenue: number; totalProductCost: number; totalExpense: number; netProfit: number };
export type DailyReport = Report & { date: string };
export type MonthlyReport = Report & { month: string; daily: { date: string; revenue: number; productCost: number; expense: number; netProfit: number }[] };
export type StoreStatus = { isOpen: boolean; updatedAt: string };
