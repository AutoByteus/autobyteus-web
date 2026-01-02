<template>
  <div class="tool-call-segment my-4 p-4 border rounded-lg shadow-md" :class="statusClass">
    <!-- Header -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center space-x-2">
        <div class="status-icon w-5 h-5 flex items-center justify-center">
          <!-- Parsing (new state) -->
          <svg v-if="segment.status === 'parsing' || !segment.toolName" class="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><path d="M12 4.75V6.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M17.1266 6.87347L16.0659 7.93413" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M19.25 12L17.75 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M17.1266 17.1265L16.0659 16.0659" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 19.25V17.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M6.87347 17.1265L7.93413 16.0659" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M4.75 12L6.25 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M6.87347 6.87347L7.93413 7.93413" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>
          <!-- Parsed (Neutral) -->
          <svg v-if="segment.status === 'parsed' && segment.toolName" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l-4 4-4-4M6 16l-4-4 4-4" /></svg>
          <!-- Awaiting Approval -->
          <svg v-if="segment.status === 'awaiting-approval'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <!-- Executing -->
          <svg v-if="segment.status === 'executing'" class="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          <!-- Success -->
          <svg v-if="segment.status === 'success'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <!-- Error -->
          <svg v-if="segment.status === 'error'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <!-- Denied -->
          <svg v-if="segment.status === 'denied'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
        </div>
        <span class="font-mono text-sm font-semibold">{{ segment.toolName || 'Parsing Tool...' }}</span>
        <span v-if="segment.status !== 'parsing' && segment.toolName" class="text-xs text-gray-400">#{{ segment.invocationId.substring(5, 11) }}</span>
      </div>
    </div>

    <!-- Raw Content Streaming View -->
    <div v-if="segment.status === 'parsing' && segment.rawContent" class="arguments-section p-3 bg-gray-50 dark:bg-gray-800 rounded mb-3">
        <div class="text-xs font-semibold text-gray-600 dark:text-gray-300">Receiving...</div>
        <pre class="mt-2 text-xs text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700 p-2 rounded overflow-auto"><code>{{ segment.rawContent }}</code></pre>
    </div>
    
    <!-- Structured Arguments View (after parsing is complete) -->
    <div v-if="segment.toolName && segment.status !== 'parsing'" class="arguments-section p-3 bg-gray-50 dark:bg-gray-800 rounded mb-3">
      <details>
        <summary class="cursor-pointer text-xs font-semibold text-gray-600 dark:text-gray-300">Arguments</summary>
        <pre class="mt-2 text-xs text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700 p-2 rounded overflow-auto whitespace-pre-wrap"><code>{{ prettyArguments }}</code></pre>
      </details>
    </div>

    <!-- Approval Buttons -->
    <div v-if="segment.status === 'awaiting-approval'" class="flex items-center justify-end space-x-2 mb-3">
      <button @click="showDenyModal" class="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors">Deny</button>
      <button @click="onApprove" class="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 transition-colors">Approve</button>
    </div>
    
    <!-- Logs -->
    <div v-if="segment.logs.length > 0" class="logs-section mb-3">
      <details>
        <summary class="cursor-pointer text-xs font-semibold text-gray-600 dark:text-gray-300">Logs ({{ segment.logs.length }})</summary>
        <div class="mt-2 p-2 bg-gray-900 text-white font-mono text-xs rounded overflow-auto max-h-48">
          <pre class="whitespace-pre-wrap"><code>{{ formattedLogs }}</code></pre>
        </div>
      </details>
    </div>
    
    <!-- Result -->
    <div v-if="segment.status === 'success' && segment.result" class="result-section mb-3">
       <details>
        <summary class="cursor-pointer text-xs font-semibold text-green-700 dark:text-green-400">Result</summary>
        <pre class="mt-2 text-xs text-green-800 dark:text-green-200 bg-green-50 dark:bg-gray-800 p-2 rounded overflow-auto whitespace-pre-wrap"><code>{{ prettyResult }}</code></pre>
      </details>
    </div>

    <!-- Error Message -->
    <div v-if="segment.status === 'error' && segment.error" class="error-section mb-3">
       <details open>
        <summary class="cursor-pointer text-xs font-semibold text-red-700 dark:text-red-400">Error</summary>
        <pre class="mt-2 text-xs text-red-800 dark:text-red-200 bg-red-50 dark:bg-gray-800 p-2 rounded overflow-auto whitespace-pre-wrap"><code>{{ prettyError }}</code></pre>
      </details>
    </div>
    
    <ToolCallRejectionModal
      :visible="isRejectionModalVisible"
      @close="isRejectionModalVisible = false"
      @confirm="handleDenyConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { ToolCallSegment } from '~/types/segments';
import { useAgentRunStore } from '~/stores/agentRunStore';
import ToolCallRejectionModal from './ToolCallRejectionModal.vue';

const props = defineProps<{
  segment: ToolCallSegment;
  conversationId: string; // This is the agentId
}>();

const agentRunStore = useAgentRunStore();
const isRejectionModalVisible = ref(false);

/**
 * Pretty-prints a value. If the value is a string that represents a JSON object or array,
 * it is parsed and then stringified with indentation. Otherwise, it is handled as a plain string or object.
 * This function also un-escapes newline and quote characters within strings to ensure they are rendered correctly in the UI.
 * @param value The value to pretty-print.
 * @returns A formatted string ready for display in a `<pre>` tag.
 */
function prettyPrintJsonString(value: any): string {
  let stringified: string;
  if (typeof value === 'string') {
    try {
      // If the string is a JSON string, parse and re-stringify it prettily.
      const data = JSON.parse(value);
      stringified = JSON.stringify(data, null, 2);
    } catch (e) {
      // Not a valid JSON string, use the string as is.
      stringified = value;
    }
  } else if (value !== undefined) {
    // If it's not a string (e.g., an object), stringify it.
    // JSON.stringify will handle null correctly.
    stringified = JSON.stringify(value, null, 2);
  } else {
    return 'undefined';
  }

  // Un-escape newlines and quotes to render them correctly in <pre> tags.
  // JSON.stringify escapes \n as \\n, and " as \\".
  // We want to revert that for display to improve readability.
  return stringified.replace(/\\n/g, '\n').replace(/\\"/g, '"');
}

const statusClass = computed(() => {
  switch (props.segment.status) {
    case 'parsing': return 'border-dashed border-gray-400 dark:border-gray-500 bg-white dark:bg-gray-800';
    case 'parsed': return 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800';
    case 'awaiting-approval': return 'border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-gray-800';
    case 'executing': return 'border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-gray-800';
    case 'success': return 'border-green-400 dark:border-green-600 bg-green-50 dark:bg-gray-800';
    case 'error': return 'border-red-400 dark:border-red-600 bg-red-50 dark:bg-gray-800';
    case 'denied': return 'border-gray-400 dark:border-gray-500 bg-gray-100 dark:bg-gray-700 opacity-70';
    default: return 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800';
  }
});

const prettyArguments = computed(() => prettyPrintJsonString(props.segment.arguments));

const formattedLogs = computed(() => {
  return props.segment.logs.map(log => prettyPrintJsonString(log)).join('\n');
});

const prettyResult = computed(() => prettyPrintJsonString(props.segment.result));

const prettyError = computed(() => prettyPrintJsonString(props.segment.error));

const onApprove = () => {
  agentRunStore.postToolExecutionApproval(props.conversationId, props.segment.invocationId, true);
};

const showDenyModal = () => {
  isRejectionModalVisible.value = true;
};

const handleDenyConfirm = (reason?: string) => {
  const finalReason = reason || 'User denied execution without providing a reason.';
  agentRunStore.postToolExecutionApproval(props.conversationId, props.segment.invocationId, false, finalReason);
  isRejectionModalVisible.value = false;
};
</script>

<style scoped>
pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
