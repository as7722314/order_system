<template>
  <Teleport :to="feedback.target.value">
    <TransitionGroup name="admin-toast" tag="div" class="admin-toast-stack" aria-label="操作提示">
      <div v-for="notice in feedback.notices.value" :key="notice.id" class="admin-toast" :class="`admin-toast--${notice.kind}`" :role="notice.kind === 'error' ? 'alert' : 'status'" aria-atomic="true" @mouseenter="feedback.pause(notice.id)" @mouseleave="feedback.resume(notice.id)" @focusin="feedback.pause(notice.id)" @focusout="feedback.resume(notice.id)">
        <span class="admin-toast-symbol" aria-hidden="true">{{ notice.kind === 'success' ? '✓' : '!' }}</span>
        <div><strong>{{ notice.kind === 'success' ? '操作完成' : '操作未完成' }}</strong><p>{{ notice.message }}</p></div>
        <button type="button" aria-label="關閉操作提示" @click="feedback.dismiss(notice.id)"><AdminIcon name="close" /></button>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup lang="ts">
import { useAdminFeedback } from "../composables/useAdminFeedback";
import AdminIcon from "./AdminIcon.vue";
const feedback = useAdminFeedback();
</script>
