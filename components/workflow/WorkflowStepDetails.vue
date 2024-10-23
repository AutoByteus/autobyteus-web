<template>
  <div v-if="selectedStep" class="flex flex-col h-full w-full bg-white rounded-lg shadow-sm">
    <!-- Conversation Header -->
    <div class="shrink-0 px-4 py-3 border-b flex justify-between items-center">
      <div class="flex items-center space-x-3">
      </div>
      <div class="flex space-x-3">
        <button 
          @click="createNewConversation"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 text-sm font-medium shadow-sm"
        >
          New Conversation
        </button>
        <button 
          @click="showConversationHistory"
          class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200 text-sm font-medium"
        >
          History
        </button>
      </div>
    </div>

    <!-- Main content with flex layout -->
    <div class="flex-1 flex flex-col min-h-0">
      <!-- Conversation Content with scrollable area -->
      <div class="flex-1 overflow-y-auto p-4 min-h-0">
        <Conversation 
          v-if="activeConversation" 
          :conversation="activeConversation" 
        />
        <div v-else class="text-center text-gray-500 py-8">
          <p class="text-lg">No active conversation. Start a new one!</p>
        </div>
      </div>

      <!-- Requirement Form Section -->
      <div class="shrink-0 flex flex-col min-h-0 border-t">
        <WorkflowStepRequirementForm />
      </div>
    </div>

    <ConversationHistoryPanel 
      :is-open="isHistoryPanelOpen"
      :conversations="conversationHistory"
      @close="closeConversationHistory"
      @activate="activateHistoryConversation"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useWorkflowStore } from '~/stores/workflow'
import { useWorkflowStepStore } from '~/stores/workflowStep'
import WorkflowStepRequirementForm from '~/components/workflowStepRequirementForm/StepRequirementForm.vue'
import ConversationHistoryPanel from '~/components/conversation/ConversationHistoryPanel.vue'
import Conversation from '~/components/conversation/Conversation.vue'

const workflowStore = useWorkflowStore()
const workflowStepStore = useWorkflowStepStore()

const selectedStep = computed(() => workflowStore.selectedStep)
const activeConversation = computed(() => {
  if (selectedStep.value) {
    return workflowStepStore.activeConversation(selectedStep.value.id)
  }
  return null
})

const isHistoryPanelOpen = ref(false)
const conversationHistory = computed(() => {
  if (selectedStep.value) {
    return workflowStepStore.getConversationHistory(selectedStep.value.id)
  }
  return []
})

const createNewConversation = () => {
  if (selectedStep.value) {
    workflowStepStore.createNewConversation(selectedStep.value.id)
  }
}

const showConversationHistory = () => {
  isHistoryPanelOpen.value = true
}

const closeConversationHistory = () => {
  isHistoryPanelOpen.value = false
}

const activateHistoryConversation = (conversationId: string) => {
  if (selectedStep.value) {
    workflowStepStore.activateConversation(selectedStep.value.id, conversationId)
  }
  isHistoryPanelOpen.value = false
}

watch(selectedStep, (newStep, oldStep) => {
  if (newStep && newStep.id !== oldStep?.id) {
    workflowStepStore.resetStepState(newStep.id)
  }
}, { immediate: true })
</script>

<style>
.min-h-0 {
  min-height: 0;
}
</style>