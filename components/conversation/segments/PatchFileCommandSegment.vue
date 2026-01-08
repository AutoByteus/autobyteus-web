<template>
  <ToolCallIndicator
    :invocation-id="segment.invocationId"
    :tool-name="segment.toolName || 'patch_file'"
    :status="segment.status"
    :args="{ path: segment.path }"
    :error-message="segment.error ?? undefined"
  />
</template>

<script setup lang="ts">
import type { PatchFileSegment } from '~/types/segments';
import ToolCallIndicator from '~/components/conversation/ToolCallIndicator.vue';

const props = defineProps<{
  segment: PatchFileSegment;
  conversationId: string;
}>();
</script>

<style scoped>
/* No styles needed, wrapper only */
</style>
