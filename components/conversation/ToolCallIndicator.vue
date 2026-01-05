<template>
  <div class="my-3">
    <!-- Unified Tool Call Card -->
    <div 
      class="rounded-lg border overflow-hidden transition-all duration-200"
      :class="statusClasses"
    >
      <!-- Main Header Row -->
      <div class="flex items-center justify-between px-4 py-3">
        <!-- Left Section: Icon + Tool Info -->
        <div class="flex items-center gap-3">
          <!-- Status Icon (solid icons for bolder look) -->
          <div v-if="isExecuting" class="animate-spin h-5 w-5 border-[2.5px] border-blue-500 border-t-transparent rounded-full"></div>
          <Icon v-else-if="status === 'success'" icon="heroicons:check-circle-solid" class="w-5 h-5 text-green-500 flex-shrink-0" />
          <Icon v-else-if="status === 'error'" icon="heroicons:exclamation-circle-solid" class="w-5 h-5 text-red-500 flex-shrink-0" />
          <Icon v-else-if="isAwaiting" icon="heroicons:hand-raised-solid" class="w-5 h-5 text-amber-500 animate-pulse flex-shrink-0" />
          <Icon v-else-if="status === 'denied'" icon="heroicons:x-circle-solid" class="w-5 h-5 text-gray-400 flex-shrink-0" />
          <Icon v-else icon="heroicons:wrench-screwdriver-solid" class="w-5 h-5 text-gray-500 flex-shrink-0" />

          <!-- Tool Name -->
          <span class="font-medium text-gray-700 text-base">{{ toolName }}</span>
        </div>

        <!-- Right Section: Actions or Link -->
        <div class="flex items-center gap-2">
          <!-- Action Buttons (for awaiting-approval state) -->
          <template v-if="isAwaiting">
            <button 
              @click.stop="deny"
              class="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded text-sm font-medium transition-colors"
              :disabled="isProcessing"
            >
              Deny
            </button>
            <button 
              @click.stop="approve"
              class="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded text-sm font-medium transition-colors"
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
            <Icon icon="heroicons:arrow-top-right-on-square-solid" class="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      <!-- Context/Arguments Row (embedded style like reference) -->
      <div v-if="contextText" class="px-4 pb-3 pt-1">
        <div class="px-3 py-2 bg-[#f2f2f2] rounded cursor-default font-mono text-sm text-gray-800 truncate">
          {{ contextText }}
        </div>
      </div>

      <!-- Error Message Row (inside the same card) -->
      <div v-if="errorMessage" class="px-4 pb-3 pt-0">
        <div class="text-sm text-red-600 font-mono bg-red-100/50 px-3 py-1.5 rounded border border-red-200/50">
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
  contextText?: string;
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
