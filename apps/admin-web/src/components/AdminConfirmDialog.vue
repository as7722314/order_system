<template>
  <AdminModal :open="state.open" :title="state.title" :description="state.description" :busy="state.busy" size="sm" eyebrow="確認操作" @close="$emit('close')">
    <form :id="formId" @submit.prevent="$emit('confirm')">
      <fieldset :disabled="state.busy">
        <label v-if="state.reasonLabel" class="grid gap-2 text-sm font-medium text-stone-700">
          {{ state.reasonLabel }}
          <textarea v-model.trim="reason" class="min-h-24 rounded-md border border-stone-300 p-3" placeholder="可留空" />
        </label>
        <p v-else class="text-sm text-stone-600">請確認資料後再繼續。</p>
      </fieldset>
      <p v-if="state.error" role="alert" class="admin-form-error mt-4">{{ state.error }}</p>
    </form>
    <template #footer>
      <button class="admin-modal-cancel" type="button" data-modal-initial-focus :disabled="state.busy" @click="$emit('close')">返回</button>
      <button class="admin-modal-submit" :class="state.danger ? 'bg-red-600' : 'bg-accent'" :form="formId" type="submit" :disabled="state.busy">{{ state.busy ? "處理中…" : state.confirmLabel }}</button>
    </template>
  </AdminModal>
</template>

<script setup lang="ts">
import { computed } from "vue";
import AdminModal from "./AdminModal.vue";
import type { ConfirmationState } from "../composables/useConfirmation";

const props = defineProps<{ state: ConfirmationState }>();
const emit = defineEmits<{ close: []; confirm: []; "update:reason": [value: string] }>();
const formId = `confirmation-${crypto.randomUUID()}`;
const reason = computed({ get: () => props.state.reason, set: (value: string) => emit("update:reason", value) });
</script>
