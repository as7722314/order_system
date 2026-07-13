import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import type { CartItem, Flavor, Product } from "../types/order";

const storageKey = "line_order_cart";

function loadCart(): CartItem[] {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as CartItem[];
  } catch {
    return [];
  }
}

export const useCartStore = defineStore("cart", () => {
  const items = ref<CartItem[]>(loadCart());
  const totalAmount = computed(() => items.value.reduce((sum, item) => {
    const flavorExtra = item.flavors.reduce((flavorSum, flavor) => flavorSum + flavor.extraPrice, 0);
    return sum + (item.unitPrice + flavorExtra) * item.quantity;
  }, 0));

  function add(product: Product, quantity: number, flavors: Flavor[], note: string): void {
    items.value.push({
      productId: product.id,
      productName: product.name,
      unitPrice: product.price,
      quantity,
      flavors,
      note
    });
  }

  function remove(index: number): void {
    items.value.splice(index, 1);
  }

  function clear(): void {
    items.value = [];
  }

  watch(items, (value) => localStorage.setItem(storageKey, JSON.stringify(value)), { deep: true });

  return { items, totalAmount, add, remove, clear };
});
