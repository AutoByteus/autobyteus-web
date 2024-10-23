<template>
  <div class="flex flex-col min-h-0 w-full">
    <!-- Context Files Section -->
    <div class="shrink-0 bg-gray-50 p-4 border-b">
      <ContextFilePathsInputArea />
    </div>

    <!-- Input Area -->
    <div class="flex-1 min-h-0 bg-white p-4 flex flex-col">
      <RequirementTextInputArea 
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
import RequirementTextInputArea from '~/components/workflowStepRequirementForm/RequirementTextInputArea.vue'
import ContextFilePathsInputArea from '~/components/workflowStepRequirementForm/ContextFilePathsInputArea.vue'
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