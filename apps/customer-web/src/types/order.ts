export type ApiResponse<T> = {
  success: boolean;
  data: T;
};

export type Flavor = {
  id: string;
  name: string;
  extraPrice: number;
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
  productFlavors: ProductFlavor[];
};

export type Category = {
  id: string;
  name: string;
};

export type CartItem = {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  flavors: Flavor[];
  note: string;
};

export type OrderStatus = "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED";

export type OrderItemFlavor = {
  id: string;
  flavorNameSnapshot: string;
  extraPriceSnapshot: number;
};

export type OrderItem = {
  id: string;
  productNameSnapshot: string;
  quantity: number;
  unitPrice: number;
  flavorExtraAmount: number;
  subtotal: number;
  note?: string | null;
  flavors: OrderItemFlavor[];
};

export type CustomerOrder = {
  id?: string;
  orderNumber: string;
  customerName: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  pickupTime?: string | null;
  cancelReason?: string | null;
  items: OrderItem[];
};

export type OrderSummary = {
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
};
