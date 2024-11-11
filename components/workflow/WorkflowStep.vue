<template>
  <div 
    class="flex-grow basis-[200px] border border-gray-300 rounded-md p-2 cursor-pointer h-15 flex items-center justify-center shadow-sm transition-all duration-300 ease-in-out hover:shadow-md"
    :class="{ 'bg-blue-100 border-blue-500 shadow-md': isSelected }"
    @click="selectStep(step)"
  >
    <div class="flex flex-col items-center">
      <h3 class="text-sm font-medium text-center">{{ step.name }}</h3>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useWorkflowStore } from '~/stores/workflow';
import { useConversationStore } from '~/stores/conversationStore';
import type { Step } from '../../types/workflow';

const props = defineProps<{ 
  step: Step; 
  isSelected: boolean;
}>();
const workflowStore = useWorkflowStore();
const conversationStore = useConversationStore();

const selectStep = (step: Step) => {
  conversationStore.resetConversations();
  workflowStore.setSelectedStepId(step.id);
};
</script>