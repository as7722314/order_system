<template>
  <main class="w-full px-2 py-2">
    <section class="mb-3 overflow-hidden rounded-lg border-4 border-brand-100 bg-white/95 shadow-lg">
      <div class="bg-scallion-600 px-4 py-3 text-[30px] font-black leading-tight text-white">今日現煎</div>
      <div class="p-4">
        <h1 class="text-[48px] font-black leading-[1.05] text-brand-700">蔥香金黃，趁熱點餐</h1>
        <p class="mt-3 text-[28px] font-black leading-snug text-griddle-800">選好口味後加入購物車</p>
      </div>
    </section>

    <div class="space-y-4">
      <article v-for="product in products" :key="product.id" class="overflow-hidden rounded-lg border-4 border-brand-100 bg-white/95 shadow-lg">
        <div class="h-3 bg-gradient-to-r from-scallion-600 via-brand-500 to-brand-700"></div>
        <div class="space-y-4 p-4">
          <div class="min-w-0">
            <h2 class="break-words text-[42px] font-black leading-tight text-griddle-800">{{ product.name }}</h2>
            <p class="mt-3 text-[28px] font-bold leading-[1.38] text-stone-700">{{ product.description }}</p>
          </div>
          <div class="rounded-lg bg-brand-50 p-4 ring-2 ring-brand-100">
            <span class="block text-[24px] font-black leading-tight text-scallion-700">價格</span>
            <p class="mt-1 text-[52px] font-black leading-none text-brand-700">NT$ {{ product.price }}</p>
          </div>
          <button class="w-full rounded-lg bg-scallion-600 px-3 py-5 text-[36px] font-black leading-tight text-white shadow-lg" @click="selectedProduct = product">立即選擇</button>
        </div>
      </article>
    </div>
    <ProductModal :product="selectedProduct" @close="selectedProduct = null" @add="addToCart" />
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { fetchProducts } from "../api/client";
import ProductModal from "../components/ProductModal.vue";
import { useCartStore } from "../stores/cartStore";
import type { Product } from "../types/order";

const products = ref<Product[]>([]);
const selectedProduct = ref<Product | null>(null);
const cart = useCartStore();

async function loadProducts(): Promise<void> {
  products.value = await fetchProducts();
}

function addToCart(quantity: number, flavorIds: string[], note: string): void {
  if (!selectedProduct.value) return;
  const flavors = selectedProduct.value.productFlavors
    .map((item) => item.flavor)
    .filter((flavor) => flavorIds.includes(flavor.id));
  cart.add(selectedProduct.value, quantity, flavors, note);
  selectedProduct.value = null;
}

onMounted(loadProducts);
</script>
