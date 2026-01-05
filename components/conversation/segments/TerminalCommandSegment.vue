<template>
  <ToolCallIndicator
    :invocation-id="segment.invocationId"
    :tool-name="segment.toolName || 'Execute Bash'"
    :status="segment.status"
    :error-message="segment.error ?? undefined"
  />
</template>

<script setup lang="ts">
import type { TerminalCommandSegment } from '~/types/segments';
import ToolCallIndicator from '~/components/conversation/ToolCallIndicator.vue';

const props = defineProps<{
  segment: TerminalCommandSegment;
  conversationId: string; // This is the agentId
}>();
</script>

<style scoped>
/* No style needed, wrapper only */
</style>
