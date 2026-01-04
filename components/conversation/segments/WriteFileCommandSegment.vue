<template>
  <div class="write-file-command-segment my-4 border rounded-lg shadow-md" :class="statusClass">
    <!-- Header -->
    <div class="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 rounded-t-lg border-b border-gray-200 dark:border-gray-600">
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
      
      <div class="flex items-center space-x-2">
        <!-- View Artifact Button (Icon Only) -->
        <button 
          @click="openArtifactsTab"
          class="p-1 text-gray-500 hover:text-blue-600 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
          :class="{ 'opacity-50 cursor-not-allowed': segment.status === 'success' }"
          :disabled="segment.status === 'success'"
          title="View in Artifacts Panel"
        >
          <Icon icon="heroicons:arrow-top-right-on-square" class="w-4 h-4" />
        </button>

        <!-- Approval Buttons -->
        <div v-if="segment.status === 'awaiting-approval'" class="flex items-center space-x-2">
          <button @click="showDenyModal" class="px-2 py-0.5 text-xs font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors">Deny</button>
          <button @click="onApprove" class="px-2 py-0.5 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 transition-colors">Approve</button>
        </div>
      </div>
    </div>

    <!-- Logs & Error Details -->
    <div class="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-b-lg border-t border-gray-200 dark:border-gray-600">
      <div v-if="segment.logs.length > 0" class="logs-section mb-3">
        <details>
          <summary class="cursor-pointer text-xs font-semibold text-gray-600 dark:text-gray-300">Logs ({{ segment.logs.length }})</summary>
          <div class="mt-2 p-2 bg-gray-900 text-white font-mono text-xs rounded overflow-auto max-h-48">
            <pre class="whitespace-pre-wrap"><code>{{ segment.logs.join('\n') }}</code></pre>
          </div>
        </details>
      </div>
      
      <div v-if="segment.status === 'error' && segment.error" class="error-section">
        <details open>
          <summary class="cursor-pointer text-xs font-semibold text-red-700 dark:text-red-400">Error</summary>
          <pre class="mt-2 text-xs text-red-800 dark:text-red-200 bg-red-50 dark:bg-gray-800 p-2 rounded overflow-auto whitespace-pre-wrap"><code>{{ segment.error }}</code></pre>
        </details>
      </div>
    </div>
    
    <ToolCallRejectionModal
      :visible="isRejectionModalVisible"
      title="Reject File Write Operation"
      message="Please provide a reason for rejecting this file write operation."
      @close="isRejectionModalVisible = false"
      @confirm="handleDenyConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { WriteFileSegment } from '~/types/segments';
import { useActiveContextStore } from '~/stores/activeContextStore';
import { useRightSideTabs } from '~/composables/useRightSideTabs';
import ToolCallRejectionModal from './ToolCallRejectionModal.vue';
import { Icon } from '@iconify/vue';

// Define Props
const props = defineProps<{
  segment: WriteFileSegment;
  conversationId: string;
}>();

// Initializations
const activeContextStore = useActiveContextStore();
const { setActiveTab } = useRightSideTabs();
const isRejectionModalVisible = ref(false);

const openArtifactsTab = () => {
  setActiveTab('artifacts');
};

const onApprove = () => {
  activeContextStore.postToolExecutionApproval(props.segment.invocationId, true);
};

const showDenyModal = () => {
  isRejectionModalVisible.value = true;
};

const handleDenyConfirm = (reason?: string) => {
  const finalReason = reason || 'User denied file write operation without providing a reason.';
  activeContextStore.postToolExecutionApproval(props.segment.invocationId, false, finalReason);
  isRejectionModalVisible.value = false;
};

// Status Styles
const statusStyles: Record<string, { class: string; iconName: string; iconClass: string }> = {
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
</script>

<style scoped>
pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
