<template>
  <div class="flex flex-col bg-white focus-within:ring-2 focus-within:ring-blue-500">
    <!-- Textarea container -->
    <div class="flex-grow">
      <textarea
        v-model="userRequirement"
        ref="textarea"
        class="w-full p-4 border-0 focus:ring-0 focus:outline-none resize-none bg-transparent"
        :style="{ height: textareaHeight + 'px', minHeight: '150px' }"
        placeholder="Enter your requirement here..."
        @input="adjustTextareaHeight"
        @keydown="handleKeyDown"
      ></textarea>
    </div>

    <!-- Controls container with border top for separation -->
    <div ref="controlsRef" class="flex justify-end items-center p-4 bg-gray-50 border-t border-gray-200">
      <select
        v-if="isFirstMessage()"
        v-model="selectedModel"
        class="mr-2 p-2 border border-gray-300 rounded-md text-sm bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
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
const controlsRef = ref<HTMLDivElement | null>(null)
const textareaHeight = ref(150) // Initial height
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
    // Reset height to allow proper calculation
    textarea.value.style.height = '150px'
    
    // Get the scroll height and controls height
    const scrollHeight = textarea.value.scrollHeight
    const controlsHeight = controlsRef.value?.offsetHeight || 0
    
    // Calculate available height (viewport height minus other elements)
    const maxHeight = window.innerHeight * 0.6 // 60% of viewport height
    
    // Calculate new height considering minimum, maximum, and controls
    const newHeight = Math.min(
      Math.max(scrollHeight, 150), // Min height 150px
      maxHeight - controlsHeight - 40 // Subtract controls height and padding
    )
    
    // Apply the new height
    textarea.value.style.height = `${newHeight}px`
    textareaHeight.value = newHeight
  }
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.altKey) {
    event.preventDefault()
    handleSend()
  }
}

// Resize handler for window resize
const handleResize = () => {
  adjustTextareaHeight()
}

onMounted(() => {
  nextTick(() => {
    adjustTextareaHeight()
    window.addEventListener('resize', handleResize)
  })
})

// Clean up resize listener
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

watch(userRequirement, () => {
  workflowStepStore.updateUserRequirement(userRequirement.value)
  nextTick(() => {
    adjustTextareaHeight()
  })
})
</script>

<style scoped>
textarea {
  outline: none;
  overflow-y: auto;
}

/* Hide scrollbar for Chrome, Safari and Opera */
textarea::-webkit-scrollbar {
  display: none;
}

/* Hide scrollbar for IE, Edge and Firefox */
textarea {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
</style>