<template>
  <div 
    class="relative group"
    :class="{ 'pb-6': !isLastStep }"
  >
    <div 
      class="flex items-center p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer hover:bg-gray-50"
      :class="[
        isSelected ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100' : 'border-gray-200',
        step.status === 'completed' ? 'border-green-200' : '',
        step.status === 'in-progress' ? 'border-blue-200' : ''
      ]"
      @click="selectStep(step)"
      :aria-selected="isSelected.toString()"
      role="tab"
      :id="`step-${step.id}`"
      tabindex="0"
      @keydown.enter="selectStep(step)"
      @keydown.space.prevent="selectStep(step)"
    >
      <!-- Step Number/Status Circle -->
      <div 
        class="flex items-center justify-center w-10 h-10 rounded-full shrink-0 mr-4 transition-colors duration-200 text-base font-semibold"
        :class="[
          step.status === 'completed' ? 'bg-green-500 text-white' : 
          step.status === 'in-progress' ? 'bg-blue-500 text-white' :
          isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
        ]"
      >
        <span v-if="step.status === 'completed'" aria-label="Completed">✓</span>
        <span v-else>{{ stepNumber }}</span>
      </div>

      <!-- Step Content -->
      <div class="flex-1 min-w-0">
        <h3 class="text-base font-medium leading-6"
            :class="[isSelected ? 'text-blue-700' : 'text-gray-900']">
          {{ step.name }}
        </h3>
        <p v-if="step.description" 
           class="mt-1 text-sm text-gray-500">
          {{ step.description }}
        </p>
      </div>

      <!-- Status Badge -->
      <div v-if="step.status" class="ml-4 shrink-0">
        <span 
          class="px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap"
          :class="[
            step.status === 'completed' ? 'bg-green-100 text-green-700' :
            step.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
            'bg-gray-100 text-gray-600'
          ]"
        >
          {{ step.status }}
        </span>
      </div>
    </div>

    <!-- Connector Line -->
    <div 
      v-if="!isLastStep" 
      class="absolute left-[1.25rem] bottom-0 w-0.5 h-6 bg-gray-200"
      aria-hidden="true"
    />
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