<template>
  <div v-if="selectedStep" class="flex flex-col h-full bg-gray-50">
    <div class="flex-grow overflow-y-auto p-4">
      <div class="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div class="flex justify-between items-center mb-4">
          <div class="flex items-center space-x-2">
            <h4 class="text-lg font-medium text-gray-700">Conversation</h4>
            <span 
              v-if="selectedStep.status"
              class="px-2 py-1 text-xs rounded-full"
              :class="[
                selectedStep.status === 'completed' ? 'bg-green-100 text-green-700' :
                selectedStep.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-700'
              ]"
            >
              {{ selectedStep.status }}
            </span>
          </div>
          <div class="flex space-x-2">
            <button 
              @click="createNewConversation"
              class="px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 text-sm font-medium"
            >
              New Conversation
            </button>
            <button 
              @click="showConversationHistory"
              class="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200 text-sm font-medium"
            >
              History
            </button>
          </div>
        </div>

        <Conversation 
          v-if="activeConversation" 
          :conversation="activeConversation" 
        />
        <div v-else class="text-center text-gray-500 py-10">
          <p>No active conversation. Start a new one!</p>
        </div>
      </div>
    </div>

    <div class="border-t bg-white p-4">
      <div class="max-w-4xl mx-auto">
        <h4 class="text-sm font-medium text-gray-700 mb-2">New Message</h4>
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
import WorkflowStepRequirementForm from '~/components/workflowStepRequirementForm/WorkflowRequirementForm.vue'
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

<style scoped>
/* Optional: Add any scoped styles if necessary */
</style>