<template>
  <div 
    class="flex-1 border border-gray-300 rounded-md p-2 cursor-pointer h-15 flex items-center justify-center shadow-sm transition-all duration-300 ease-in-out mr-2 last:mr-0 hover:shadow-md"
    :class="{ 'bg-gray-200 shadow-md': isSelected }"
    @click="selectStep(step)"
  >
    <h3 class="text-sm font-medium">{{ step.name }}</h3>
  </div>
</template>

<script setup lang="ts">
import { useWorkflowStore } from '~/stores/workflow'
import type { Step } from '../../types/workflow'

const props = defineProps<{ step: Step; isSelected: boolean }>()
const workflowStore = useWorkflowStore()

const selectStep = (step: Step) => {
  workflowStore.setSelectedStepId(step.id)
}
</script>