<template>
  <div class="bg-white rounded-lg border border-gray-200">
    <div class="p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
      <ContextFilePathsEditor class="max-h-32 overflow-y-auto" />
    </div>

    <div class="relative">
      <RequirementInputArea 
        :is-first-message="isFirstMessage()" 
        :is-sending="isSending" 
        :selected-model="selectedModel" 
        @send="handleSend" 
        @update-model="selectedModel = $event"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useWorkflowStore } from '~/stores/workflow'
import { useWorkflowStepStore } from '~/stores/workflowStep'
import { useWorkspaceStore } from '~/stores/workspace'
import ContextFilePathsEditor from '~/components/workflowStepRequirementForm/ContextFilePathEditor.vue'
import RequirementInputArea from '~/components/workflowStepRequirementForm/RequirementInputArea.vue'
import { LlmModel } from '~/generated/graphql'

const workflowStore = useWorkflowStore()
const workflowStepStore = useWorkflowStepStore()
const workspaceStore = useWorkspaceStore()

const { userRequirement } = storeToRefs(workflowStepStore)
const isSending = computed(() => workflowStepStore.isCurrentlySending)
const selectedModel = ref<LlmModel>(LlmModel.Claude_3_5SonnetApi)

const isFirstMessage = () => {
  const stepId = workflowStore.selectedStep?.id
  return stepId ? workflowStepStore.isFirstMessage(stepId) : false
}

const handleSend = async (requirement: string, model?: LlmModel) => {
  if (!requirement.trim()) {
    alert('Please enter a user requirement before sending.')
    return
  }

  const workspaceId = workspaceStore.currentSelectedWorkspaceId
  const stepId = workflowStore.selectedStep?.id

  if (!workspaceId || !stepId) {
    alert('Workspace or step is not selected.')
    return
  }

  try {
    if (!workflowStepStore.getActiveConversationId(stepId)) {
      workflowStepStore.createNewConversation(stepId)
    }

    await workflowStepStore.sendStepRequirementAndSubscribe(
      workspaceId,
      stepId,
      requirement,
      model
    )

    userRequirement.value = ''
  } catch (error) {
    console.error('Error sending requirement:', error)
    alert('Failed to send requirement. Please try again.')
  }
}
</script>

<style>
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out;
}
</style>