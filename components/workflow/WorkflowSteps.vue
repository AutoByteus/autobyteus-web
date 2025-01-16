<template>
  <div class="workflow-steps h-full">
    <h2 class="text-xl font-semibold mb-6">Workflow</h2>
    
    <div class="flex flex-col space-y-3">
      <div 
        v-for="step in steps"
        :key="step.id"
        class="workflow-step-item p-3 border border-gray-200 rounded-lg cursor-pointer transition-all duration-200"
        :class="{
          'bg-blue-50 border-blue-500 shadow-sm': selectedStepId === step.id,
          'hover:bg-gray-50 hover:border-gray-300': selectedStepId !== step.id
        }"
        @click="selectStep(step.id)"
      >
        <div class="flex items-center gap-3">
          <div 
            class="step-number w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
            :class="selectedStepId === step.id ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'"
          >
            {{ steps.indexOf(step) + 1 }}
          </div>
          <div class="flex-1">
            <h3 class="font-medium text-gray-900">{{ step.name }}</h3>
            <p v-if="step.description" class="text-sm text-gray-500 mt-1">{{ step.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useWorkflowStore } from '~/stores/workflow'
import { useWorkflowUIStore } from '~/stores/workflowUI'

const workflowStore = useWorkflowStore()
const workflowUIStore = useWorkflowUIStore()

const steps = computed(() => {
  if (!workflowStore.currentWorkflow) return []
  return Object.values(workflowStore.currentWorkflow.steps)
})

const selectedStepId = computed(() => workflowStore.currentSelectedStepId)

const selectStep = (stepId: string) => {
  workflowStore.setSelectedStepId(stepId)
  workflowUIStore.closeWorkflow()
}
</script>

<style scoped>
.workflow-steps {
  padding: 1rem;
}

.workflow-step-item {
  position: relative;
  overflow: hidden;
}

.workflow-step-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 3px;
  background-color: transparent;
  transition: background-color 0.2s ease;
}

.workflow-step-item.selected::before {
  background-color: #3b82f6;
}
</style>
