<template>
  <div 
    class="relative group"
    :class="{ 'mb-2': !isLastStep }"
  >
    <div 
      class="flex items-center p-2 rounded-md border transition-all duration-200 cursor-pointer hover:bg-gray-50"
      :class="[isSelected ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-100' : 'border-gray-200']"
      @click="selectStep(step)"
      role="tab"
      :id="`step-${step.id}`"
      tabindex="0"
      @keydown.enter="selectStep(step)"
      @keydown.space.prevent="selectStep(step)"
    >
      <!-- Step Number Circle - Reduced size -->
      <div 
        class="flex items-center justify-center w-6 h-6 rounded-full shrink-0 mr-2 transition-colors duration-200 text-xs font-semibold bg-gray-100 text-gray-600"
      >
        {{ stepNumber }}
      </div>

      <!-- Step Content -->
      <div class="flex-1 min-w-0">
        <h3 class="text-sm font-medium leading-4"
            :class="[isSelected ? 'text-blue-700' : 'text-gray-900']">
          {{ step.name }}
        </h3>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useWorkflowStore } from '~/stores/workflow'
import type { Step } from '~/types/workflow'

const props = defineProps<{ 
  step: Step; 
  isSelected: boolean;
  stepNumber: number;
  isLastStep: boolean;
}>()

const workflowStore = useWorkflowStore()

const selectStep = (step: Step) => {
  workflowStore.setSelectedStepId(step.id)
}
</script>

<style scoped>
.step-enter-active,
.step-leave-active {
  transition: all 0.3s ease;
}

.step-enter-from,
.step-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>