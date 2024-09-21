<template>
  <div v-if="selectedStep" class="space-y-6 p-4 bg-white rounded-lg shadow">
    <h3 class="text-xl font-semibold text-gray-800">Selected Step: {{ selectedStep.name }}</h3>
    
    <div class="space-y-2">
      <h4 class="text-lg font-medium text-gray-700">Edit Prompt:</h4>
      <PromptEditor 
        :prompt="selectedStep.prompt_template.template" 
        @update:prompt="updatePrompt"
      />
    </div>

    <div 
      class="space-y-2"
      @dragover.prevent
      @drop.prevent="onFileDrop"
    >
      <h4 class="text-lg font-medium text-gray-700">Context File Paths:</h4>
      <div 
        class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition duration-300"
      >
        <p class="text-gray-600" v-if="contextFilePaths.length === 0">
          Drag and drop files or folders here
        </p>
        <ContextFilePathList v-else />
      </div>
    </div>

    <div class="space-y-2">
      <h4 class="text-lg font-medium text-gray-700">User Requirement:</h4>
      <div class="relative">
        <div
          ref="editableDiv"
          :innerHTML="userRequirement"
          v-auto-expand
          contenteditable="true"
          class="p-2 pr-12 min-h-[80px] max-h-[300px] border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent overflow-y-auto"
          placeholder="Enter your requirement here..."
          @input="updateUserRequirement"
        ></div>
        <button 
          @click="handleSend"
          :disabled="isSending || !userRequirement.trim()"
          class="absolute bottom-2 right-2 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-300 disabled:opacity-50 flex items-center"
        >
          <svg v-if="isSending" class="animate-spin h-4 w-4 mr-1 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          <span v-if="!isSending">Send</span>
          <span v-else>Sending...</span>
        </button>
      </div>
      <span v-if="isSending" class="text-sm text-gray-600">AI is responding...</span>
    </div>

    <div class="space-y-4 mt-6 h-64 overflow-y-auto">
      <h4 class="text-lg font-medium text-gray-700">AI Responses:</h4>
      <div class="space-y-2 flex flex-col">
        <div 
          v-for="(message, index) in messages" 
          :key="index"
          :class="{
            'self-end bg-blue-100 text-blue-800': message.type === 'user',
            'self-start bg-gray-100 text-gray-800': message.type === 'ai'
          }"
          class="p-3 rounded-lg max-w-md relative"
        >
          <div v-if="message.type === 'user'">
            <div>
              <strong>Context Files:</strong>
              <ul class="list-disc list-inside">
                <li v-for="path in message.contextFilePaths" :key="path">{{ path }}</li>
              </ul>
            </div>
            <div class="mt-2">
              <strong>User Requirement:</strong>
              <div>{{ message.text }}</div>
            </div>
          </div>
          <div v-else>
            {{ message.text }}
          </div>
          <span class="text-xs text-gray-500 absolute bottom-1 right-2">
            {{ formatTimestamp(message.timestamp) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useWorkflowStore } from '~/stores/workflow'
import { useWorkflowStepStore } from '~/stores/workflowStep'
import { useWorkspaceStore } from '~/stores/workspace'
import PromptEditor from '~/components/prompt/PromptEditor.vue'
import ContextFilePathList from '~/components/workflow/ContextFilePathList.vue'
import { getFilePathsFromFolder } from '~/utils/fileExplorer/fileUtils'
import type { TreeNode } from '~/utils/fileExplorer/TreeNode'

// Initialize stores
const workflowStore = useWorkflowStore()
const workflowStepStore = useWorkflowStepStore()
const workspaceStore = useWorkspaceStore()

// Computed properties
const selectedStep = computed(() => workflowStore.selectedStep)
const contextFilePaths = computed(() => workflowStore.contextFilePaths)
const messages = computed(() => workflowStepStore.messages)
const isSending = computed(() => workflowStepStore.isCurrentlySending)

// Access userRequirement from workflowStepStore
const userRequirement = computed({
  get: () => workflowStepStore.currentUserRequirement,
  set: (value: string) => workflowStepStore.setUserRequirement(value)
})

const editableDiv = ref<HTMLDivElement | null>(null)

// Custom directive for auto-expanding
const vAutoExpand = {
  mounted(el: HTMLElement) {
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  },
  updated(el: HTMLElement) {
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }
}

// Function to update the prompt
const updatePrompt = (newPrompt: string) => {
  workflowStore.updateStepPrompt(newPrompt)
}

// Handle file drop
const onFileDrop = (event: DragEvent) => {
  const dragData = event.dataTransfer?.getData('application/json')
  if (dragData) {
    const droppedNode: TreeNode = JSON.parse(dragData)
    const filePaths = getFilePathsFromFolder(droppedNode)
    filePaths.forEach(filePath => {
      workflowStore.addContextFilePath(filePath)
    })
  }
}

// Function to update userRequirement from contenteditable div
const updateUserRequirement = (event: Event) => {
  const target = event.target as HTMLDivElement
  userRequirement.value = target.innerHTML
}

// Handle sending user requirement
const handleSend = async () => {
  if (!userRequirement.value.trim()) {
    alert('Please enter a user requirement before sending.')
    return
  }

  if (contextFilePaths.value.length === 0) {
    alert('Please add at least one context file path before sending.')
    return
  }

  // Create a combined user message
  workflowStepStore.addUserMessage({
    text: userRequirement.value,
    contextFilePaths: [...contextFilePaths.value],
    timestamp: new Date()
  })

  try {
    const workspaceRootPath = workspaceStore.currentSelectedWorkspacePath
    await workflowStepStore.sendStepRequirementAndSubscribe(
      workspaceRootPath,
      selectedStep.value?.id || '',
      contextFilePaths.value,
      userRequirement.value
    )
    
    // Clear the contenteditable div after sending
    if (editableDiv.value) {
      editableDiv.value.innerHTML = ''
    }
    userRequirement.value = ''
  } catch (error) {
    console.error('Error during send:', error)
    alert('Failed to send the requirement. Please try again.')
  }
}

// Watch for resends to clear previous AI messages after the last user message
watch(
  () => userRequirement.value,
  (newVal, oldVal) => {
    if (newVal !== oldVal) {
      try {
        workflowStepStore.clearMessagesAfterLastUser()
      } catch (error) {
        console.error('Error clearing messages:', error)
        // Optionally, you can show a user-friendly error message here
      }
    }
  }
)

// Helper function to format timestamps
const formatTimestamp = (date: Date) => {
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

// Ensure the contenteditable div displays the placeholder when empty
onMounted(() => {
  if (editableDiv.value) {
    editableDiv.value.addEventListener('focus', () => {
      if (editableDiv.value!.innerHTML.trim() === '') {
        editableDiv.value!.innerHTML = ''
      }
    })
    
    editableDiv.value.addEventListener('blur', () => {
      if (editableDiv.value!.innerHTML.trim() === '') {
        editableDiv.value!.innerHTML = ''
      }
    })
  }
})
</script>

<style scoped>
[contenteditable=true]:empty:before {
  content: attr(placeholder);
  color: #9ca3af;
  font-style: italic;
}
</style>