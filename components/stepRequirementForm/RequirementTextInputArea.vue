<template>
  <div class="relative">
    <textarea
      v-model="userRequirement"
      ref="textarea"
      class="w-full p-4 pr-24 pb-16 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none overflow-hidden bg-white transition-all duration-300"
      :style="{ height: textareaHeight + 'px' }"
      placeholder="Enter your requirement here..."
      @input="adjustTextareaHeight"
      @keydown="handleKeyDown"
    ></textarea>
    <div class="absolute bottom-4 right-4 flex items-center">
      <select
        v-if="isFirstMessage()"
        v-model="selectedModel"
        class="mr-2 p-2 border border-gray-300 rounded-md text-sm"
      >
        <option v-for="model in llmModels" :key="model" :value="model">
          {{ model }}
        </option>
      </select>
      <button 
        @click="handleSend"
        :disabled="isSending || !userRequirement.trim()"
        class="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-sm"
      >
        <svg v-if="isSending" class="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
        <svg v-else class="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
        </svg>
        <span>{{ isSending ? 'Sending...' : 'Send' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useWorkflowStore } from '~/stores/workflow'
import { useWorkflowStepStore } from '~/stores/workflowStep'
import { useWorkspaceStore } from '~/stores/workspace'
import { LlmModel } from '~/generated/graphql'

const workflowStore = useWorkflowStore()
const workflowStepStore = useWorkflowStepStore()
const workspaceStore = useWorkspaceStore()

const { userRequirement } = storeToRefs(workflowStepStore)
const isSending = computed(() => workflowStepStore.isCurrentlySending)
const textarea = ref<HTMLTextAreaElement | null>(null)
const textareaHeight = ref(100) // Initial height
const selectedModel = ref<LlmModel>(LlmModel.Claude_3_5SonnetApi)

const llmModels = Object.values(LlmModel)

const isFirstMessage = () => {
  const stepId = workflowStore.selectedStep?.id
  return stepId ? workflowStepStore.isFirstMessage(stepId) : false
}

const handleSend = async () => {
  if (!userRequirement.value.trim()) {
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
    // Check if there's an active conversation, if not, create a new one
    if (!workflowStepStore.getActiveConversationId(stepId)) {
      workflowStepStore.createNewConversation(stepId)
    }

    await workflowStepStore.sendStepRequirementAndSubscribe(
      workspaceId,
      stepId,
      userRequirement.value,
      isFirstMessage() ? selectedModel.value : undefined
    )

    userRequirement.value = ''
    adjustTextareaHeight()
  } catch (error) {
    console.error('Error sending requirement:', error)
    alert('Failed to send requirement. Please try again.')
  }
}

const adjustTextareaHeight = () => {
  if (textarea.value) {
    textarea.value.style.height = 'auto'
    textarea.value.style.height = `${textarea.value.scrollHeight}px`
    textareaHeight.value = textarea.value.scrollHeight
  }
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.altKey) {
    event.preventDefault() // Prevents adding a newline
    handleSend()
  }
}

onMounted(() => {
  nextTick(() => {
    adjustTextareaHeight()
  })
})

watch(userRequirement, () => {
  workflowStepStore.updateUserRequirement(userRequirement.value)
})
</script>

<style scoped>
/* Add any scoped styles if necessary */
</style>