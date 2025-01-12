<template>
  <div class="flex flex-col space-y-3">
    <div 
      v-for="step in steps"
      :key="step.id"
      class="p-2 border border-gray-300 rounded-md cursor-pointer transition-all duration-300 hover:bg-gray-100"
      :class="{ 'bg-blue-100 border-blue-500': selectedStepId === step.id }"
      @click="selectStep(step.id)"
    >
      {{ step.name }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useWorkflowStore } from '~/stores/workflow';
import type { Step } from '~/types/workflow';
import { useWorkflowUIStore } from '~/stores/workflowUI';

const workflowStore = useWorkflowStore();
const workflowUIStore = useWorkflowUIStore();

const steps = computed(() => {
  if (!workflowStore.currentWorkflow) return [];
  return Object.values(workflowStore.currentWorkflow.steps);
});

const selectedStepId = computed(() => workflowStore.currentSelectedStepId);

const selectStep = (stepId: string) => {
  workflowStore.setSelectedStepId(stepId);
  // Close workflow panel after selecting a step
  workflowUIStore.closeWorkflow();
};
</script>

<style scoped>
/* Basic styling for the vertical workflow steps */
</style>
