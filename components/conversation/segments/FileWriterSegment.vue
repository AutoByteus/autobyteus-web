<template>
  <div class="file-writer-segment my-4 border rounded-lg shadow-md" :class="statusClass">
    <!-- Header: Tool Name, Path, and Status -->
    <div class="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 rounded-t-md border-b border-gray-200 dark:border-gray-600">
      <div class="flex items-center space-x-2 overflow-hidden">
        <div class="status-icon w-5 h-5 flex-shrink-0 flex items-center justify-center">
          <component :is="statusIcon" class="h-5 w-5" :class="statusIconClass" />
        </div>
        <span class="font-mono text-sm font-semibold text-gray-800 dark:text-gray-200">
          Tool: {{ segment.toolName }}
        </span>
        <span class="font-mono text-sm text-gray-500 dark:text-gray-400 truncate" :title="segment.arguments.path">
          {{ segment.arguments.path }}
        </span>
      </div>
    </div>

    <!-- Content: File Display -->
    <div class="bg-white dark:bg-gray-800 p-1">
      <FileDisplay 
        v-if="segment.arguments.path && segment.arguments.content"
        :path="segment.arguments.path" 
        :content="segment.arguments.content" 
      />
      <div v-else class="p-4 text-gray-500 italic">
        File path or content is missing in the tool call.
      </div>
    </div>

    <!-- Controls & Details (Logs, Errors, etc.) -->
    <div class="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-b-lg">
      <!-- Approval Buttons -->
      <div v-if="segment.status === 'awaiting-approval'" class="flex items-center justify-end space-x-2 mb-3">
        <button @click="onDeny" class="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors">Deny</button>
        <button @click="onApprove" class="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 transition-colors">Approve</button>
      </div>
      
      <!-- Logs -->
      <div v-if="segment.logs.length > 0" class="logs-section mb-3">
        <details>
          <summary class="cursor-pointer text-xs font-semibold text-gray-600 dark:text-gray-300">Logs ({{ segment.logs.length }})</summary>
          <div class="mt-2 p-2 bg-gray-900 text-white font-mono text-xs rounded overflow-auto max-h-48">
            <p v-for="(log, index) in segment.logs" :key="index">{{ log }}</p>
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
  </div>
</template>

<script setup lang="ts">
import { computed, h } from 'vue';
import type { ToolCallSegment } from '~/utils/aiResponseParser/types';
import { useConversationStore } from '~/stores/conversationStore';
import FileDisplay from '~/components/conversation/segments/renderer/FileDisplay.vue';
import { BeakerIcon, CheckCircleIcon, ClockIcon, CodeBracketIcon, ExclamationCircleIcon, HandRaisedIcon, XCircleIcon } from '@heroicons/vue/24/solid';

const props = defineProps<{  segment: ToolCallSegment;
  conversationId: string;
}>();

const conversationStore = useConversationStore();

const statusStyles = {
    parsed: { class: 'border-gray-300 dark:border-gray-600', icon: CodeBracketIcon, iconClass: 'text-gray-400' },
    'awaiting-approval': { class: 'border-yellow-400 dark:border-yellow-600', icon: HandRaisedIcon, iconClass: 'text-yellow-500' },
    executing: { class: 'border-blue-400 dark:border-blue-600', icon: () => h('svg', { class: 'animate-spin h-5 w-5 text-blue-500', xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24" }, [h('circle', { class: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", 'stroke-width': "4" }), h('path', { class: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })]), iconClass: '' },
    success: { class: 'border-green-400 dark:border-green-600', icon: CheckCircleIcon, iconClass: 'text-green-500' },
    error: { class: 'border-red-400 dark:border-red-600', icon: XCircleIcon, iconClass: 'text-red-500' },
    denied: { class: 'border-gray-400 dark:border-gray-500 opacity-70', icon: ExclamationCircleIcon, iconClass: 'text-gray-500' },
    parsing: { class: 'border-dashed border-gray-400 dark:border-gray-500', icon: BeakerIcon, iconClass: 'text-gray-400 animate-pulse' },
};

const statusClass = computed(() => statusStyles[props.segment.status]?.class || 'border-gray-300 dark:border-gray-600');
const statusIcon = computed(() => statusStyles[props.segment.status]?.icon || CodeBracketIcon);
const statusIconClass = computed(() => statusStyles[props.segment.status]?.iconClass || 'text-gray-400');

const onApprove = () => {
  conversationStore.postToolExecutionApproval(props.conversationId, props.segment.invocationId, true);
};

const onDeny = () => {
  conversationStore.postToolExecutionApproval(props.conversationId, props.segment.invocationId, false, 'User denied execution.');
};
</script>

<style scoped>
pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
