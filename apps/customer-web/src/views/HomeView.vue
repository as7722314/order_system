<template>
  <main class="customer-shell">
    <section class="hero-panel">
      <div class="hero-content">
        <div>
          <span class="hero-kicker">今日現煎</span>
          <h1 class="hero-title">今天想吃哪一份？</h1>
          <p class="hero-copy">選好口味，送出後立即為你準備。</p>
        </div>
        <span class="hero-illustration" aria-hidden="true">餅</span>
      </div>
    </section>

    <div class="menu-heading">
      <div>
        <span class="menu-eyebrow">MENU</span>
        <h2>現點現煎</h2>
      </div>
      <span>{{ products.length }} 項商品</span>
    </div>

    <div class="menu-list">
      <article v-for="product in products" :key="product.id" class="food-card">
        <button class="product-card-button" type="button" @click="selectedProduct = product">
          <div class="product-thumb">
            <span>餅</span>
          </div>
          <div class="product-card-body">
            <h3 class="food-title">{{ product.name }}</h3>
            <p class="food-copy">{{ product.description || "酥香現煎，口味任選" }}</p>
            <div class="product-card-footer">
              <strong class="menu-price"><small>NT$</small>{{ product.price }}</strong>
              <span class="add-button" aria-hidden="true">＋</span>
            </div>
          </div>
        </button>
      </article>
    </div>

    <RouterLink v-if="cart.items.length" class="cart-dock" to="/cart">
      <span class="cart-dock-count">{{ cart.items.length }}</span>
      <span>查看購物車</span>
      <strong>NT$ {{ cart.totalAmount }} <b>›</b></strong>
    </RouterLink>

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
