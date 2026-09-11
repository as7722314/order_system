<template>
  <main class="customer-shell">
    <section class="hero-panel mb-4">
      <div class="hero-strip">今日現煎</div>
      <div class="p-4">
        <h1 class="hero-title">蔥香金黃，趁熱點餐</h1>
        <p class="hero-copy">選好口味後加入購物車，現煎熱度剛剛好。</p>
      </div>
    </section>

    <div class="space-y-4">
      <article v-for="product in products" :key="product.id" class="food-card">
        <div class="food-card-top"></div>
        <div class="space-y-4 p-4">
          <div class="min-w-0">
            <h2 class="food-title">{{ product.name }}</h2>
            <p class="food-copy">{{ product.description }}</p>
          </div>
          <div class="price-panel">
            <span class="price-label">價格</span>
            <p class="price-value">NT$ {{ product.price }}</p>
          </div>
          <button class="primary-action" @click="selectedProduct = product">立即選擇</button>
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
