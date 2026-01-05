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
import type { TerminalCommandSegment } from '~/types/segments';
import ToolCallIndicator from '~/components/conversation/ToolCallIndicator.vue';

const props = defineProps<{
  segment: TerminalCommandSegment;
  conversationId: string;
}>();

// Show a truncated version of the command for context
const displayName = computed(() => {
  if (props.segment.command) {
    // Truncate long commands
    const cmd = props.segment.command.length > 40 
      ? props.segment.command.substring(0, 40) + '...'
      : props.segment.command;
    return `run_terminal_cmd → ${cmd}`;
  }
  return props.segment.toolName || 'run_terminal_cmd';
});
</script>

<style scoped>
/* No style needed, wrapper only */
</style>
