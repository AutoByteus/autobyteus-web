<template>
  <div class="terminal-command-segment my-4 border rounded-lg shadow-md" :class="statusClass">
    <!-- Header -->
    <div class="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 rounded-t-md border-b border-gray-200 dark:border-gray-600">
      <div class="flex items-center space-x-2 overflow-hidden">
        <div class="status-icon w-5 h-5 flex-shrink-0 flex items-center justify-center">
          <svg v-if="statusIconName === 'spinner'" class="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <Icon v-else :icon="statusIconName" class="h-5 w-5" :class="statusIconClass" />
        </div>
        <span class="font-mono text-sm font-semibold text-gray-800 dark:text-gray-200">
        {{ segment.toolName }}
        </span>
        <span v-if="segment.status !== 'parsing'" class="text-xs text-gray-400">#{{ segment.invocationId.substring(5, 11) }}</span>
      </div>

      <!-- Approval Buttons -->
      <div v-if="segment.status === 'awaiting-approval'" class="flex items-center justify-end space-x-2">
        <button @click="showDenyModal" class="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors">Deny</button>
        <button @click="onApprove" class="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 transition-colors">Approve</button>
      </div>
    </div>

    <!-- Command Display -->
    <div class="p-3 bg-gray-50 dark:bg-gray-800">
      <div class="text-xs font-semibold text-gray-600 dark:text-gray-300">Command</div>
      <pre class="mt-2 text-xs text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700 p-2 rounded overflow-auto whitespace-pre-wrap"><code>{{ segment.command || 'Awaiting command stream...' }}</code></pre>
    </div>

    <!-- Logs & Error Details -->
    <div class="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-b-lg border-t border-gray-200 dark:border-gray-600">
      <div v-if="segment.logs.length > 0" class="logs-section mb-3">
        <details>
          <summary class="cursor-pointer text-xs font-semibold text-gray-600 dark:text-gray-300">Logs ({{ segment.logs.length }})</summary>
          <div class="mt-2 p-2 bg-gray-900 text-white font-mono text-xs rounded overflow-auto max-h-48">
            <pre class="whitespace-pre-wrap"><code>{{ formattedLogs }}</code></pre>
          </div>
        </details>
      </div>

      <div v-if="segment.status === 'success' && segment.result" class="result-section mb-3">
        <details>
          <summary class="cursor-pointer text-xs font-semibold text-green-700 dark:text-green-400">Result</summary>
          <pre class="mt-2 text-xs text-green-800 dark:text-green-200 bg-green-50 dark:bg-gray-800 p-2 rounded overflow-auto whitespace-pre-wrap"><code>{{ prettyResult }}</code></pre>
        </details>
      </div>

      <div v-if="segment.status === 'error' && segment.error" class="error-section">
        <details open>
          <summary class="cursor-pointer text-xs font-semibold text-red-700 dark:text-red-400">Error</summary>
          <pre class="mt-2 text-xs text-red-800 dark:text-red-200 bg-red-50 dark:bg-gray-800 p-2 rounded overflow-auto whitespace-pre-wrap"><code>{{ prettyError }}</code></pre>
        </details>
      </div>
    </div>

    <ToolCallRejectionModal
      :visible="isRejectionModalVisible"
      title="Reject Terminal Command"
      message="Please provide a reason for rejecting this terminal command."
      @close="isRejectionModalVisible = false"
      @confirm="handleDenyConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { TerminalCommandSegment } from '~/types/segments';
import { useActiveContextStore } from '~/stores/activeContextStore';
import ToolCallRejectionModal from './ToolCallRejectionModal.vue';
import { Icon } from '@iconify/vue';

const props = defineProps<{
  segment: TerminalCommandSegment;
  conversationId: string; // This is the agentId
}>();

const activeContextStore = useActiveContextStore();
const isRejectionModalVisible = ref(false);

function prettyPrintJsonString(value: any): string {
  let stringified: string;
  if (typeof value === 'string') {
    try {
      const data = JSON.parse(value);
      stringified = JSON.stringify(data, null, 2);
    } catch (e) {
      stringified = value;
    }
  } else if (value !== undefined) {
    stringified = JSON.stringify(value, null, 2);
  } else {
    return 'undefined';
  }

  return stringified.replace(/\\n/g, '\n').replace(/\\"/g, '"');
}

const statusStyles = {
  parsed: { class: 'border-gray-300 dark:border-gray-600', iconName: 'heroicons:code-bracket-solid', iconClass: 'text-gray-400' },
  'awaiting-approval': { class: 'border-yellow-400 dark:border-yellow-600', iconName: 'heroicons:hand-raised-solid', iconClass: 'text-yellow-500' },
  executing: { class: 'border-blue-400 dark:border-blue-600', iconName: 'spinner', iconClass: 'text-blue-500' },
  success: { class: 'border-green-400 dark:border-green-600', iconName: 'heroicons:check-circle-solid', iconClass: 'text-green-500' },
  error: { class: 'border-red-400 dark:border-red-600', iconName: 'heroicons:x-circle-solid', iconClass: 'text-red-500' },
  denied: { class: 'border-gray-400 dark:border-gray-500 opacity-70', iconName: 'heroicons:exclamation-circle-solid', iconClass: 'text-gray-500' },
  parsing: { class: 'border-dashed border-gray-400 dark:border-gray-500', iconName: 'heroicons:beaker-solid', iconClass: 'text-gray-400 animate-pulse' },
};

const statusClass = computed(() => statusStyles[props.segment.status]?.class || 'border-gray-300 dark:border-gray-600');
const statusIconName = computed(() => statusStyles[props.segment.status]?.iconName || 'heroicons:code-bracket-solid');
const statusIconClass = computed(() => statusStyles[props.segment.status]?.iconClass || 'text-gray-400');

const formattedLogs = computed(() => {
  return props.segment.logs.map(log => prettyPrintJsonString(log)).join('\n');
});

const prettyResult = computed(() => prettyPrintJsonString(props.segment.result));
const prettyError = computed(() => prettyPrintJsonString(props.segment.error));

const onApprove = () => {
  activeContextStore.postToolExecutionApproval(props.segment.invocationId, true);
};

const showDenyModal = () => {
  isRejectionModalVisible.value = true;
};

const handleDenyConfirm = (reason?: string) => {
  const finalReason = reason || 'User denied terminal command without providing a reason.';
  activeContextStore.postToolExecutionApproval(props.segment.invocationId, false, finalReason);
  isRejectionModalVisible.value = false;
};
</script>

<style scoped>
pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
