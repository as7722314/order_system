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

export type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  status: OrderStatus | Lowercase<OrderStatus>;
  totalAmount: number;
  createdAt: string;
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
