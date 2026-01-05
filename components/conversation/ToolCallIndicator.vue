<template>
  <div class="my-2 select-none group">
    <!-- Main Pill -->
    <div 
      class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono transition-all duration-200"
      :class="statusClasses"
    >
      <!-- Icon -->
      <div v-if="isExecuting" class="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full"></div>
      <Icon v-else-if="status === 'success'" name="heroicons:check-circle" class="w-3.5 h-3.5" />
      <Icon v-else-if="status === 'error'" name="heroicons:exclamation-circle" class="w-3.5 h-3.5" />
      <Icon v-else-if="isAwaiting" name="heroicons:shield-check" class="w-3.5 h-3.5 animate-pulse" />
      <Icon v-else name="heroicons:code-bracket" class="w-3.5 h-3.5" />

      <!-- Text -->
      <span class="font-bold truncate max-w-[200px]">{{ toolName }}</span>
      <span v-if="status === 'success'" class="opacity-75">finished</span>
      <span v-else-if="isExecuting" class="opacity-75">running...</span>
      <span v-else-if="isAwaiting" class="opacity-75">requests permission</span>

      <!-- Action Buttons (Inline Rejection) -->
      <div v-if="isAwaiting" class="flex items-center gap-1 ml-2 pl-2 border-l border-current/20">
        <button 
          @click.stop="approve"
          class="px-2 py-0.5 bg-green-500/10 hover:bg-green-500/20 text-green-600 rounded text-[10px] font-bold uppercase transition-colors"
          :disabled="isProcessing"
        >
          Allow
        </button>
        <button 
          @click.stop="deny"
          class="px-2 py-0.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 rounded text-[10px] font-bold uppercase transition-colors"
          :disabled="isProcessing"
        >
          Deny
        </button>
      </div>

      <!-- Link to Activity Tab (if not awaiting) -->
      <button 
        v-if="!isAwaiting"
        @click="goToActivity"
        class="ml-1 opacity-0 group-hover:opacity-50 hover:opacity-100 transition-opacity"
        title="View Details in Activity Tab"
      >
        <Icon name="heroicons:arrow-top-right-on-square" class="w-3 h-3" />
      </button>
    </div>

    <!-- Error Message (if any) -->
    <div v-if="errorMessage" class="mt-1 ml-2 text-[10px] text-red-500 font-mono">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
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

const statusClasses = computed(() => {
  switch (props.status) {
    case 'executing':
    case 'parsing':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'success':
      return 'bg-gray-50 text-gray-600 border-gray-200'; // Neutral/Quiet on success
    case 'error':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'awaiting-approval':
      return 'bg-amber-50 text-amber-800 border-amber-300 ring-1 ring-amber-200';
    case 'denied':
      return 'bg-gray-100 text-gray-400 border-gray-200 decoration-line-through';
    default:
      return 'bg-gray-50 text-gray-600 border-gray-200';
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
