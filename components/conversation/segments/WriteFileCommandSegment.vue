<template>
  <ToolCallIndicator
    :invocation-id="segment.invocationId"
    :tool-name="segment.toolName"
    :status="segment.status"
    :error-message="segment.error ?? undefined"
  />
</template>

<script setup lang="ts">
import type { WriteFileSegment } from '~/types/segments';
import ToolCallIndicator from '~/components/conversation/ToolCallIndicator.vue';

// Define Props
const props = defineProps<{
  segment: WriteFileSegment;
  conversationId: string;
}>();
</script>

<style scoped>
/* No styles needed, wrapper only */
</style>
