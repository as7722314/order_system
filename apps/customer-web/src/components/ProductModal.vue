<template>
  <div v-if="product" class="product-modal fixed inset-0 z-30" @click.self="close">
    <section class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-scroll">
        <div class="modal-product-head">
          <div class="min-w-0">
            <h2 class="food-title">{{ product.name }}</h2>
            <p class="food-copy">{{ product.description }}</p>
          </div>
          <button class="modal-close" type="button" aria-label="關閉" @click="close">×</button>
        </div>
        <div>
          <div class="section-label">選擇口味 <small>最多 2 種・已選 {{ selectedFlavorIds.length }}</small></div>
          <div class="flavor-list">
            <label v-for="item in product.productFlavors" :key="item.flavor.id" class="flavor-option">
              <input
                v-model="selectedFlavorIds"
                class="flavor-checkbox"
                type="checkbox"
                :value="item.flavor.id"
                :disabled="selectedFlavorIds.length >= 2 && !selectedFlavorIds.includes(item.flavor.id)"
              />
              <span>{{ item.flavor.name }}</span>
              <small v-if="item.flavor.extraPrice">+ NT$ {{ item.flavor.extraPrice }}</small>
            </label>
          </div>
        </div>
        <div class="quantity-panel">
          <span class="section-label">數量</span>
          <div class="quantity-stepper">
            <button class="quantity-button" :disabled="quantity <= 1" @click="quantity -= 1">−</button>
            <span>{{ quantity }}</span>
            <button class="quantity-button" @click="quantity += 1">＋</button>
          </div>
        </div>
        <label class="block">
          <span class="section-label">備註 <small>選填</small></span>
          <textarea v-model="note" class="field-input" rows="2" placeholder="例如：不要太焦"></textarea>
        </label>
        <div class="modal-action">
          <button class="primary-action" @click="submit">
            <span>加入購物車</span>
            <strong>NT$ {{ total }}</strong>
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { Product } from "../types/order";

const props = defineProps<{ product: Product | null }>();
const emit = defineEmits<{ close: []; add: [quantity: number, flavorIds: string[], note: string] }>();

const quantity = ref(1);
const selectedFlavorIds = ref<string[]>([]);
const note = ref("");
const total = computed(() => {
  if (!props.product) return 0;
  const flavorExtra = props.product.productFlavors
    .filter((item) => selectedFlavorIds.value.includes(item.flavor.id))
    .reduce((sum, item) => sum + item.flavor.extraPrice, 0);
  return (props.product.price + flavorExtra) * quantity.value;
});

function reset(): void {
  selectedFlavorIds.value = [];
  quantity.value = 1;
  note.value = "";
}

function close(): void {
  reset();
  emit("close");
}

function submit(): void {
  emit("add", quantity.value, selectedFlavorIds.value, note.value);
  reset();
}

watch(() => props.product?.id, () => reset());
</script>
