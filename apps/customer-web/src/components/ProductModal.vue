<template>
  <div v-if="product" class="product-modal fixed inset-0 z-30 px-3 py-3" @click.self="$emit('close')">
    <section class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="space-y-5 overflow-y-auto px-4 pb-5">
        <div class="modal-product-head">
          <div class="min-w-0">
            <span class="product-label">口味選擇</span>
            <h2 class="food-title">{{ product.name }}</h2>
            <p class="food-copy">{{ product.description }}</p>
          </div>
          <div class="price-tag">
            <span>NT$</span>
            <strong>{{ product.price }}</strong>
          </div>
        </div>
        <div>
          <div class="section-label">選擇口味 <small>已選 {{ selectedFlavorIds.length }} / 2</small></div>
          <div class="grid grid-cols-1 gap-3">
            <label v-for="item in product.productFlavors" :key="item.flavor.id" class="flavor-option">
              <input
                v-model="selectedFlavorIds"
                class="h-8 w-8 shrink-0 accent-scallion-600"
                type="checkbox"
                :value="item.flavor.id"
                :disabled="selectedFlavorIds.length >= 2 && !selectedFlavorIds.includes(item.flavor.id)"
              />
              <span>{{ item.flavor.name }} <span v-if="item.flavor.extraPrice" class="text-brand-700">+{{ item.flavor.extraPrice }}</span></span>
            </label>
          </div>
        </div>
        <div class="quantity-panel">
          <span class="section-label">數量</span>
          <div class="mt-3 grid grid-cols-[82px_1fr_82px] items-center gap-3">
            <button class="quantity-button" :disabled="quantity <= 1" @click="quantity -= 1">−</button>
            <span class="text-center text-[42px] font-bold leading-none">{{ quantity }}</span>
            <button class="quantity-button" @click="quantity += 1">＋</button>
          </div>
        </div>
        <textarea v-model="note" class="field-input" rows="3" placeholder="備註"></textarea>
        <div class="grid grid-cols-1 gap-3 pb-1">
          <button class="primary-action" @click="submit">加入購物車</button>
          <button class="secondary-action" @click="$emit('close')">取消</button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { Product } from "../types/order";

defineProps<{ product: Product | null }>();
const emit = defineEmits<{ close: []; add: [quantity: number, flavorIds: string[], note: string] }>();

const quantity = ref(1);
const selectedFlavorIds = ref<string[]>([]);
const note = ref("");

function submit(): void {
  emit("add", quantity.value, selectedFlavorIds.value, note.value);
  selectedFlavorIds.value = [];
  quantity.value = 1;
  note.value = "";
}
</script>
