<template>
  <div 
    class="flex items-center justify-between py-1.5 pl-2 pr-2 rounded cursor-pointer group transition-colors"
    :class="isSelected 
      ? 'bg-indigo-50 text-indigo-900' 
      : 'hover:bg-gray-50 text-gray-600'"
    @click="$emit('select', instance.state.agentId)"
  >
    <div class="flex items-center space-x-2 min-w-0">
      <!-- Status Dot -->
      <span class="status-indicator h-2 w-2 rounded-full flex-shrink-0" :class="statusColor"></span>
      
      <!-- Instance Label -->
      <span class="text-sm text-gray-700 truncate">
        {{ instanceLabel }}
      </span>
    </div>

    <!-- Actions -->
    <button
      @click.stop="$emit('delete', instance.state.agentId)"
      class="delete-btn inline-flex h-6 w-6 items-center justify-center rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 transition-colors"
      title="Stop and remove instance"
      aria-label="Close agent instance"
    >
      <span class="text-sm leading-none font-semibold" aria-hidden="true">×</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { AgentContext } from '~/types/agent/AgentContext';
import { AgentStatus } from '~/types/agent/AgentStatus';

const props = defineProps<{
  instance: AgentContext;
  isSelected?: boolean;
}>();

defineEmits<{
  (e: 'select', id: string): void;
  (e: 'delete', id: string): void;
}>();

// Label format matches the running instance list style in the workspace.
const instanceLabel = computed(() => {
  const name = props.instance.config.agentDefinitionName || 'Agent';
  const agentId = props.instance.state.agentId;
  
  if (agentId.startsWith('temp-')) {
    return `New - ${name}`;
  }
  
  // Use last 4 characters of the ID for a short, stable suffix.
  const idSuffix = agentId.slice(-4).toUpperCase();
  return `${name} - ${idSuffix}`;
});

const statusColor = computed(() => {
  switch (props.instance.state.currentStatus) {
    case AgentStatus.Idle: return 'bg-green-400';
    case AgentStatus.Bootstrapping:
    case AgentStatus.ProcessingUserInput:
    case AgentStatus.ExecutingTool:
    case AgentStatus.ProcessingToolResult:
    case AgentStatus.AnalyzingLlmResponse:
      return 'bg-blue-400 animate-pulse';
    case AgentStatus.AwaitingToolApproval:
    case AgentStatus.AwaitingLlmResponse:
      return 'bg-yellow-400';
    case AgentStatus.Error:
    case AgentStatus.ToolDenied:
      return 'bg-red-500';
    case AgentStatus.ShuttingDown:
    case AgentStatus.ShutdownComplete:
      return 'bg-gray-400';
    default: return 'bg-gray-300';
  }
});
</script>
