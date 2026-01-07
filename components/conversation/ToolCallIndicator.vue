<template>
  <div class="my-3">
    <!-- Unified Tool Call Card -->
    <div 
      class="rounded-lg border overflow-hidden transition-all duration-200"
      :class="statusClasses"
    >
      <!-- Main Header Row (Non-clickable for expanding) -->
      <div class="flex items-center justify-between px-3 py-2 cursor-default select-none">
        <!-- Left Section: Icon + Tool Info -->
        <div class="flex items-center gap-2 overflow-hidden">
          <!-- Status Icon -->
          <div v-if="isExecuting" class="animate-spin h-5 w-5 border-[2.5px] border-blue-500 border-t-transparent rounded-full flex-shrink-0"></div>
          <Icon v-else-if="status === 'success'" icon="heroicons:check-circle-solid" class="w-5 h-5 text-green-500 flex-shrink-0" />
          <Icon v-else-if="status === 'error'" icon="heroicons:exclamation-circle-solid" class="w-5 h-5 text-red-500 flex-shrink-0" />
          <Icon v-else-if="isAwaiting" icon="heroicons:hand-raised-solid" class="w-5 h-5 text-amber-500 animate-pulse flex-shrink-0" />
          <Icon v-else-if="status === 'denied'" icon="heroicons:x-circle-solid" class="w-5 h-5 text-gray-400 flex-shrink-0" />
          <Icon v-else icon="heroicons:wrench-screwdriver-solid" class="w-5 h-5 text-gray-500 flex-shrink-0" />

          <!-- Tool Name -->
          <div class="flex items-baseline gap-2 overflow-hidden">
            <span class="font-medium text-gray-700 text-sm truncate">{{ toolName }}</span>
            <span class="font-mono text-[10px] text-gray-400 flex-shrink-0">#{{ invocationId.slice(0, 6) }}</span>
          </div>
        </div>

        <!-- Right Section: Actions or Link -->
        <div class="flex items-center gap-2 flex-shrink-0 ml-2">
          <!-- Action Buttons (for awaiting-approval state) -->
          <template v-if="isAwaiting">
            <button 
              @click.stop="deny"
              class="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded text-xs font-medium transition-colors"
              :disabled="isProcessing"
            >
              Deny
            </button>
            <button 
              @click.stop="approve"
              class="px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-medium transition-colors"
              :disabled="isProcessing"
            >
              Approve
            </button>
          </template>

          <!-- External Link Button -->
          <button 
            v-if="!isAwaiting"
            @click.stop="goToActivity"
            class="p-1 rounded hover:bg-black/10 transition-colors"
            title="View Details in Activity Tab"
          >
            <Icon icon="heroicons:arrow-top-right-on-square-solid" class="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      <!-- Arguments Section (classic disclosure) -->
      <div v-if="hasArgs" class="px-3 pb-3 pt-1">
        <div class="bg-[#f2f2f2] dark:bg-gray-800 rounded px-3 py-2">
          <details>
            <summary class="cursor-pointer text-xs font-semibold text-gray-600 dark:text-gray-300 list-inside">
              Arguments
            </summary>
            <pre class="mt-2 text-xs text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900 border border-[#e9ecef] dark:border-gray-700 rounded p-2 font-mono whitespace-pre-wrap overflow-x-auto"><code>{{ prettyArgs }}</code></pre>
          </details>
        </div>
      </div>

      <!-- Error Message Row (always visible if error exists) -->
      <div v-if="errorMessage" class="px-3 pb-2 pt-0 border-t border-red-100/50">
        <div class="text-xs text-red-600 font-mono bg-red-50 px-2 py-1 rounded border border-red-100 mt-2">
          {{ errorMessage }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Icon } from '@iconify/vue';
import { useActiveContextStore } from '~/stores/activeContextStore';
import { useRightSideTabs } from '~/composables/useRightSideTabs';
import { useAgentActivityStore } from '~/stores/agentActivityStore';

const props = defineProps<{
  invocationId: string;
  toolName: string;
  status: string;
  args?: Record<string, any> | string; // New prop for arguments
  errorMessage?: string;
}>();

const activeContextStore = useActiveContextStore();
const { setActiveTab } = useRightSideTabs();
const activityStore = useAgentActivityStore();

const isProcessing = ref(false);
const isExecuting = computed(() => props.status === 'executing' || props.status === 'parsing');
const isAwaiting = computed(() => props.status === 'awaiting-approval');

const statusClasses = computed(() => {
  switch (props.status) {
    case 'executing':
    case 'parsing':
      return 'bg-blue-50 border-blue-200';
    case 'success':
      return 'bg-green-50 border-green-200';
    case 'error':
      return 'bg-red-50 border-red-200';
    case 'awaiting-approval':
      return 'bg-amber-50 border-amber-200';
    case 'denied':
      return 'bg-gray-100 border-gray-200 opacity-70';
    default:
      return 'bg-gray-50 border-gray-200';
  }
});

const hasArgs = computed(() => {
  if (props.args === undefined || props.args === null) return false;
  if (typeof props.args === 'string') return props.args.trim().length > 0;
  return Object.keys(props.args).length > 0;
});

function prettyPrintArgs(value: any): string {
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return value;
    }
  }
  if (value !== undefined) {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
  return '';
}

const prettyArgs = computed(() => prettyPrintArgs(props.args));

const approve = async () => {
  if (isProcessing.value) return;
  isProcessing.value = true;
  try {
    await activeContextStore.postToolExecutionApproval(props.invocationId, true);
  } finally {
    isProcessing.value = false;
  }
};

const deny = async () => {
  if (isProcessing.value) return;
  isProcessing.value = true;
  try {
    await activeContextStore.postToolExecutionApproval(props.invocationId, false, "User denied via inline chat.");
  } finally {
    isProcessing.value = false;
  }
};

const goToActivity = () => {
  setActiveTab('progress');
  const agentId = activeContextStore.activeAgentContext?.state.agentId;
  if (agentId) {
    activityStore.setHighlightedActivity(agentId, props.invocationId);
  }
};
</script>

<style scoped>
div {
  -webkit-font-smoothing: antialiased;
}
</style>
