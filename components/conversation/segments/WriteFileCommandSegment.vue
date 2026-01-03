<template>
  <div class="write-file-command-segment my-4 border rounded-lg shadow-md" :class="statusClass">
    <!-- Header: Tool Name, Status, and Approval Buttons -->
    <div class="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 rounded-t-md border-b border-gray-200 dark:border-gray-600">
      <!-- Left side: Status Icon and Tool Name -->
      <div class="flex items-center space-x-2 overflow-hidden">
        <div class="status-icon w-5 h-5 flex-shrink-0 flex items-center justify-center">
          <svg v-if="statusIconName === 'spinner'" class="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <Icon v-else :icon="statusIconName" class="h-5 w-5" :class="statusIconClass" />
        </div>
        <span class="font-mono text-sm font-semibold text-gray-800 dark:text-gray-200">
          Tool: {{ segment.toolName }}
        </span>
      </div>
      
      <!-- Right side: Approval Buttons -->
      <div v-if="segment.status === 'awaiting-approval'" class="flex items-center justify-end space-x-2">
        <button @click="showDenyModal" class="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors">Deny</button>
        <button @click="onApprove" class="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 transition-colors">Approve</button>
      </div>
    </div>

    <!-- Sub-header for file content, with expand/collapse button -->
    <div class="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-2 border-b border-gray-200 dark:border-gray-600">
        <div class="flex items-center min-w-0">
          <button
            @click="toggleExpand"
            class="mr-2 p-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors focus:outline-none flex-shrink-0"
            :aria-expanded="isExpanded"
            aria-label="Toggle file content"
          >
            <svg
              class="w-4 h-4 transform transition-transform text-gray-600 dark:text-gray-400"
              :class="{ 'rotate-90': isExpanded }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
          <span class="font-mono text-sm text-gray-700 dark:text-gray-300 break-all" :title="segment.arguments.path">
            File: {{ segment.arguments.path }}
          </span>
        </div>
        <CopyButton v-if="segment.arguments.content" :text-to-copy="segment.arguments.content" />
    </div>

    <!-- Collapsed content preview -->
    <div
      v-if="!isExpanded && segment.arguments.content"
      class="p-2 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      @click="toggleExpand"
    >
      <div class="preview-content">
        <code class="text-sm font-mono text-gray-600 dark:text-gray-400">{{ contentPreview }}</code>
      </div>
    </div>
    
    <!-- Full content when expanded -->
    <div v-else class="bg-white dark:bg-gray-800">
       <FileDisplay 
        v-if="segment.arguments.path && segment.arguments.content"
        :path="segment.arguments.path" 
        :content="segment.arguments.content" 
      />
      <div v-else class="p-4 text-gray-500 italic">
        File path or content is missing in the tool call.
      </div>
    </div>

    <!-- Logs & Error Details -->
    <div class="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-b-lg border-t border-gray-200 dark:border-gray-600">
      <!-- Logs -->
      <div v-if="segment.logs.length > 0" class="logs-section mb-3">
        <details>
          <summary class="cursor-pointer text-xs font-semibold text-gray-600 dark:text-gray-300">Logs ({{ segment.logs.length }})</summary>
          <div class="mt-2 p-2 bg-gray-900 text-white font-mono text-xs rounded overflow-auto max-h-48">
            <pre class="whitespace-pre-wrap"><code>{{ segment.logs.join('\n') }}</code></pre>
          </div>
        </details>
      </div>
      
      <!-- Error Message -->
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
import { computed, h, ref } from 'vue';
import type { ToolCallSegment } from '~/types/segments';
import { useActiveContextStore } from '~/stores/activeContextStore';
import FileDisplay from '~/components/conversation/segments/renderer/FileDisplay.vue';
import CopyButton from '~/components/common/CopyButton.vue';
import ToolCallRejectionModal from './ToolCallRejectionModal.vue';
import { Icon } from '@iconify/vue';

const props = defineProps<{
  segment: ToolCallSegment;
  conversationId: string; // This is the agentId
}>();

const activeContextStore = useActiveContextStore();
const isRejectionModalVisible = ref(false);

// --- State for expand/collapse functionality ---
const isExpanded = ref(false);

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
};

const contentPreview = computed(() => {
  const content = props.segment.arguments.content || '';
  if (!content) return 'No content to display.';
  const lines = content.split('\n');
  const preview = lines.slice(0, 5).join('\n');
  return lines.length > 5 ? preview + '\n...' : preview;
});
// --- End expand/collapse state ---

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
</script>

<style scoped>
pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}
.preview-content {
  max-height: 7.5em; /* ≈5 lines */
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  line-height: 1.5;
}
</style>
