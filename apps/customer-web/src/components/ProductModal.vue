<template>
  <div v-if="product" class="fixed inset-0 z-30 bg-griddle-800/45 px-2 py-2" @click.self="$emit('close')">
    <section class="flex max-h-[96vh] w-full flex-col overflow-hidden rounded-lg bg-white shadow-xl">
      <div class="space-y-5 overflow-y-auto p-4">
        <div>
          <h2 class="break-words text-[44px] font-black leading-tight text-griddle-800">{{ product.name }}</h2>
          <p class="mt-3 text-[28px] font-bold leading-[1.35] text-stone-700">{{ product.description }}</p>
          <p class="mt-4 text-[52px] font-black leading-none text-brand-700">NT$ {{ product.price }}</p>
        </div>
        <div>
          <div class="mb-3 text-[30px] font-black leading-snug text-griddle-800">口味 已選擇 {{ selectedFlavorIds.length }} / 2</div>
          <div class="grid grid-cols-1 gap-3">
            <label v-for="item in product.productFlavors" :key="item.flavor.id" class="flex min-h-[84px] items-center gap-3 rounded-lg border border-brand-100 bg-brand-50/40 p-4 text-[30px] font-black leading-tight">
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
        <div class="rounded-lg bg-griddle-50 p-4">
          <span class="block text-[30px] font-black leading-tight">數量</span>
          <div class="mt-3 grid grid-cols-[82px_1fr_82px] items-center gap-3">
            <button class="h-[82px] rounded-lg border border-brand-100 bg-white text-[48px] font-black leading-none" :disabled="quantity <= 1" @click="quantity -= 1">-</button>
            <span class="text-center text-[48px] font-black leading-none">{{ quantity }}</span>
            <button class="h-[82px] rounded-lg border border-brand-100 bg-white text-[48px] font-black leading-none" @click="quantity += 1">+</button>
          </div>
        </div>
        <textarea v-model="note" class="w-full rounded-lg border border-brand-100 p-4 text-[30px] font-bold leading-snug" rows="3" placeholder="備註"></textarea>
        <div class="grid grid-cols-1 gap-3 pb-1">
          <button class="rounded-lg bg-scallion-600 py-5 text-[34px] font-black leading-tight text-white" @click="submit">加入購物車</button>
          <button class="rounded-lg border border-brand-100 bg-white py-4 text-[30px] font-black leading-tight" @click="$emit('close')">取消</button>
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
