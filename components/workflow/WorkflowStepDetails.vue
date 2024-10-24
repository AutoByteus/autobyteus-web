<template>
  <div v-if="selectedStep" class="flex flex-col">
      <div class="mb-4">
        <PromptEditor 
          :promptTemplates="selectedStep.prompt_templates"
          :stepId="selectedStep.id"
        />
      </div>
  
      <div class="flex justify-between items-center mb-4">
        <h4 class="text-lg font-medium text-gray-700">Conversation</h4>
        <div>
          <button @click="createNewConversation" class="mr-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
            New Conversation
          </button>
          <button @click="showConversationHistory" class="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
            History
          </button>
        </div>
      </div>
  
      <div class="flex flex-col">
        <Conversation v-if="activeConversation" :conversation="activeConversation" />
  
        <div class="mt-4 bg-white">
          <h4 class="text-lg font-medium text-gray-700 mb-2">New Message</h4>
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
import PromptEditor from '~/components/prompt/PromptEditor.vue'
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