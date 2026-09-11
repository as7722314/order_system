<template>
  <main class="customer-shell">
    <section class="hero-panel mb-4">
      <div class="hero-content">
        <span class="hero-kicker">今日現煎</span>
        <h1 class="hero-title">今天想吃哪一份？</h1>
        <p class="hero-copy">選好口味與數量，我們收到訂單後立即為你準備。</p>
        <div class="hero-note"><span></span> 線上點餐僅提供當日取餐</div>
      </div>
    </section>

    <div class="space-y-4">
      <article v-for="product in products" :key="product.id" class="food-card">
        <div class="p-4">
          <div class="product-heading">
            <div class="min-w-0">
              <span class="product-label">現點現煎</span>
              <h2 class="food-title">{{ product.name }}</h2>
            </div>
            <div class="price-tag">
              <span>NT$</span>
              <strong>{{ product.price }}</strong>
            </div>
          </div>
          <div class="mt-3">
            <p class="food-copy">{{ product.description }}</p>
          </div>
          <button class="primary-action mt-5" @click="selectedProduct = product">
            選擇口味與數量 <span aria-hidden="true">›</span>
          </button>
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
