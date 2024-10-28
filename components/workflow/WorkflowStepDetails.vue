<template>
  <div v-if="selectedStep" class="flex flex-col h-full">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2 sm:gap-0">
      <h4 class="text-lg font-medium text-gray-700">Conversation</h4>
      <div class="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
        <button 
          @click="createNewConversation" 
          class="w-full sm:w-auto px-4 py-2 sm:px-3 sm:py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-center">
          New Conversation
        </button>
        <button 
          @click="showConversationHistory" 
          class="w-full sm:w-auto px-4 py-2 sm:px-3 sm:py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-center">
          History
        </button>
      </div>
    </div>

    <!-- Main content area with flexible spacing -->
    <div class="flex flex-col h-[calc(100%-2rem)] relative">
      <!-- Conversation container with flexible growth -->
      <div class="flex-1 overflow-y-auto mb-4 pr-2">
        <div class="flex flex-col h-full">
          <!-- Messages section -->
          <div class="flex-grow">
            <Conversation v-if="activeConversation" :conversation="activeConversation" />
          </div>
          <!-- Spacer when no messages -->
          <div v-if="!activeConversation?.messages?.length" class="flex-grow" />
        </div>
      </div>

      <!-- Form container with consistent positioning -->
      <div class="w-full bg-white pt-4">
        <WorkflowStepRequirementForm />
      </div>
    </div>

    <ConversationHistoryPanel 
      :isOpen="isHistoryPanelOpen"
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
import WorkflowStepRequirementForm from '~/components/stepRequirementForm/WorkflowStepRequirementForm.vue'
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