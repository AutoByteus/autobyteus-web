<template>
  <div class="workflow-steps">    
    <div class="flex flex-col space-y-3">
      <div 
        v-for="step in steps"
        :key="step.id"
        class="workflow-step-item p-3 border border-gray-200 rounded-lg cursor-pointer transition-all duration-200"
        :class="{
          'bg-blue-50 border-blue-500 shadow-sm': currentSelectedStepId === step.id,
          'hover:bg-gray-50 hover:border-gray-300': currentSelectedStepId !== step.id
        }"
        @click="handleSelectStep(step.id)"
      >
        <div class="flex items-center gap-3">
          <div 
            class="step-number w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
            :class="currentSelectedStepId === step.id ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'"
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
import { useConversationStore } from '~/stores/conversationStore'; // Added

const workflowStore = useWorkflowStore()
const workflowUIStore = useWorkflowUIStore()
const conversationStore = useConversationStore(); // Added

const steps = computed(() => {
  if (!workflowStore.currentWorkflow) return []
  return Object.values(workflowStore.currentWorkflow.steps)
})

const currentSelectedStepId = computed(() => workflowStore.currentSelectedStepId)

const handleSelectStep = (stepId: string) => {
  workflowStore.setSelectedStepId(stepId) // Sets the sidebar highlight and current workflow step
  conversationStore.createTemporaryConversation(stepId) // Creates a new tab for this step and makes it active
  workflowUIStore.closeWorkflow() // Existing UI behavior for closing panel on mobile
}
</script>

<style scoped>
.workflow-steps {
  height: 100%;
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

/* This class was 'selected', changed to match class binding */
.workflow-step-item.bg-blue-50::before {
  background-color: #3b82f6; /* Tailwind blue-500 */
}
</style>
