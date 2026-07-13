export type ApiResponse<T> = {
  success: boolean;
  data: T;
};

export type Category = {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
};

export type Flavor = {
  id: string;
  name: string;
  extraPrice: number;
  sortOrder: number;
  isActive: boolean;
};

export type ProductFlavor = {
  flavorId: string;
  flavor: Flavor;
};

export type Product = {
  id: string;
  categoryId: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  price: number;
  sortOrder: number;
  isActive: boolean;
  productFlavors?: ProductFlavor[];
};

export type OrderStatus = "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED";

export type OrderItemFlavor = {
  id: string;
  orderItemId: string;
  flavorId?: string | null;
  flavorNameSnapshot: string;
  extraPriceSnapshot: number;
};

export type OrderItem = {
  id: string;
  orderId: string;
  productId?: string | null;
  productNameSnapshot: string;
  quantity: number;
  unitPrice: number;
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


export type BackfillOrderItemInput = {
  productId: string;
  quantity: number;
  flavorIds: string[];
  note?: string;
};

export type BackfillOrderPayload = {
  customerName: string;
  customerPhone: string;
  note?: string;
  items: BackfillOrderItemInput[];
};
export type Expense = {
  id: string;
  expenseDate: string;
  name: string;
  amount: number;
  note?: string | null;
};

export type Report = {
  orderCount: number;
  totalRevenue: number;
  totalExpense: number;
  netProfit: number;
};
