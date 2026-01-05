<template>
  <ToolCallIndicator
    :invocation-id="segment.invocationId"
    :tool-name="displayName"
    :status="segment.status"
    :error-message="segment.error ?? undefined"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { WriteFileSegment } from '~/types/segments';
import ToolCallIndicator from '~/components/conversation/ToolCallIndicator.vue';

// Define Props
const props = defineProps<{
  segment: WriteFileSegment;
  conversationId: string;
}>();

// Extract just the filename from the full path for a cleaner display
const displayName = computed(() => {
  if (props.segment.path) {
    const filename = props.segment.path.split('/').pop() || props.segment.path;
    return `write_file → ${filename}`;
  }
  return props.segment.toolName || 'write_file';
});
</script>

<style scoped>
/* No styles needed, wrapper only */
</style>
