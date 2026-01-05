<template>
  <div class="my-3">
    <!-- Full-width Tool Call Bar -->
    <div 
      class="flex items-center justify-between px-4 py-2.5 rounded-lg border transition-all duration-200"
      :class="statusClasses"
    >
      <!-- Left Section: Icon + Tool Info -->
      <div class="flex items-center gap-3">
        <!-- Status Icon -->
        <div v-if="isExecuting" class="animate-spin h-5 w-5 border-2 border-blue-400 border-t-transparent rounded-full"></div>
        <Icon v-else-if="status === 'success'" icon="heroicons:check-circle" class="w-5 h-5 text-green-500 flex-shrink-0" />
        <Icon v-else-if="status === 'error'" icon="heroicons:exclamation-circle" class="w-5 h-5 text-red-500 flex-shrink-0" />
        <Icon v-else-if="isAwaiting" icon="heroicons:hand-raised" class="w-5 h-5 text-amber-500 animate-pulse flex-shrink-0" />
        <Icon v-else-if="status === 'denied'" icon="heroicons:x-circle" class="w-5 h-5 text-gray-400 flex-shrink-0" />
        <Icon v-else icon="heroicons:wrench-screwdriver" class="w-5 h-5 text-gray-400 flex-shrink-0" />

        <!-- Tool Name -->
        <span class="font-medium text-gray-700 text-sm">{{ toolName }}</span>
      </div>

      <!-- Right Section: Actions or Link -->
      <div class="flex items-center gap-2">
        <!-- Action Buttons (for awaiting-approval state) -->
        <template v-if="isAwaiting">
          <button 
            @click.stop="deny"
            class="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded text-xs font-medium transition-colors"
            :disabled="isProcessing"
          >
            Deny
          </button>
          <button 
            @click.stop="approve"
            class="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-medium transition-colors"
            :disabled="isProcessing"
          >
            Approve
          </button>
        </template>

        <!-- External Link Button -->
        <button 
          v-if="!isAwaiting"
          @click="goToActivity"
          class="p-1.5 rounded-md hover:bg-gray-200 transition-colors"
          title="View Details in Activity Tab"
        >
          <Icon icon="heroicons:arrow-top-right-on-square" class="w-4 h-4 text-gray-500" />
        </button>
      </div>
    </div>

    <!-- Error Message (if any) -->
    <div v-if="errorMessage" class="mt-2 ml-4 text-xs text-red-600 font-mono bg-red-50 px-3 py-1.5 rounded-md border border-red-200">
      {{ errorMessage }}
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
  status: string; // 'parsing' | 'awaiting-approval' | 'executing' | 'success' | 'error' | 'denied'
  errorMessage?: string;
}>();

const activeContextStore = useActiveContextStore();
const { setActiveTab } = useRightSideTabs();
const activityStore = useAgentActivityStore();

const isProcessing = ref(false);

const isExecuting = computed(() => props.status === 'executing' || props.status === 'parsing');
const isAwaiting = computed(() => props.status === 'awaiting-approval');

const statusText = computed(() => {
  switch (props.status) {
    case 'success': return 'completed';
    case 'executing': 
    case 'parsing': return 'running...';
    case 'awaiting-approval': return 'awaiting approval';
    case 'error': return 'failed';
    case 'denied': return 'denied';
    default: return '';
  }
});

const statusTextClass = computed(() => {
  switch (props.status) {
    case 'success': return 'text-gray-500';
    case 'executing':
    case 'parsing': return 'text-blue-600';
    case 'awaiting-approval': return 'text-amber-600';
    case 'error': return 'text-red-500';
    case 'denied': return 'text-gray-400 line-through';
    default: return 'text-gray-500';
  }
});

const statusClasses = computed(() => {
  switch (props.status) {
    case 'executing':
    case 'parsing':
      return 'bg-blue-50 border-blue-200';
    case 'success':
      return 'bg-white border-gray-200';
    case 'error':
      return 'bg-red-50 border-red-200';
    case 'awaiting-approval':
      return 'bg-white border-gray-200';
    case 'denied':
      return 'bg-white border-gray-200';
    default:
      return 'bg-white border-gray-200';
  }
});

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
  // 1. Switch Tab
  setActiveTab('progress');
  // 2. Highlight Item (Store action)
  const agentId = activeContextStore.activeAgentContext?.state.agentId;
  if (agentId) {
    activityStore.setHighlightedActivity(agentId, props.invocationId);
  }
};
</script>

<style scoped>
/* Ensure clean font rendering */
div {
  -webkit-font-smoothing: antialiased;
}
</style>
