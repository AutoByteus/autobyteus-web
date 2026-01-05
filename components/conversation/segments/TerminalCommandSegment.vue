<template>
  <ToolCallIndicator
    :invocation-id="segment.invocationId"
    :tool-name="segment.toolName || 'run_terminal_cmd'"
    :status="segment.status"
    :context-text="segment.command"
    :error-message="segment.error ?? undefined"
  />
</template>

<script setup lang="ts">
import type { TerminalCommandSegment } from '~/types/segments';
import ToolCallIndicator from '~/components/conversation/ToolCallIndicator.vue';

const props = defineProps<{
  segment: TerminalCommandSegment;
  conversationId: string;
}>();
</script>

<style scoped>
/* No style needed, wrapper only */
</style>
