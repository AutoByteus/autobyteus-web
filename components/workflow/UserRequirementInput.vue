<template>
    <div class="user-requirement-input">
      <div
        class="border border-gray-300 rounded-md p-4 relative"
        @dragover.prevent
        @drop.prevent="onFileDrop"
      >
        <ContextFilePathList
          v-if="contextFilePaths.length > 0"
          :contextFilePaths="contextFilePaths"
          @removePath="removePath"
          @clearAllPaths="clearAllPaths"
          class="mb-4"
        />
  
        <div
          class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition duration-300 mb-4"
        >
          <p class="text-gray-400 italic text-sm">
            Drag and drop files or folders here to add context (optional)
          </p>
        </div>
  
        <div
          ref="editableDiv"
          :innerHTML="userRequirement"
          contenteditable="true"
          class="min-h-[80px] mb-4 focus:outline-none border-t border-gray-200 pt-4"
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
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { useWorkflowStore } from '~/stores/workflow'
  import { useWorkflowStepStore } from '~/stores/workflowStep'
  import ContextFilePathList from '~/components/workflow/ContextFilePathList.vue'
  import { getFilePathsFromFolder } from '~/utils/fileExplorer/fileUtils'
  import type { TreeNode } from '~/utils/fileExplorer/TreeNode'
  
  const workflowStore = useWorkflowStore()
  const workflowStepStore = useWorkflowStepStore()
  
  const contextFilePaths = computed(() => workflowStore.contextFilePaths)
  const isSending = computed(() => workflowStepStore.isCurrentlySending)
  
  const userRequirement = computed({
    get: () => workflowStepStore.currentUserRequirement,
    set: (value: string) => workflowStepStore.setUserRequirement(value)
  })
  
  const editableDiv = ref<HTMLDivElement | null>(null)
  
  const updateUserRequirement = (event: Event) => {
    const target = event.target as HTMLDivElement
    userRequirement.value = target.innerHTML
  }
  
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
  
  const removePath = (index: number) => {
    workflowStore.removeContextFilePath(index)
  }
  
  const clearAllPaths = () => {
    workflowStore.clearAllContextFilePaths()
  }
  
  const handleSend = () => {
    if (!userRequirement.value.trim()) {
      alert('Please enter a user requirement before sending.')
      return
    }
  
    const payload = {
      text: userRequirement.value,
      contextFilePaths: [...contextFilePaths.value],
      timestamp: new Date()
    }
  
    workflowStepStore.addUserMessage(payload)
    // Additional logic for sending the message can be added here
    // Clear the input after sending
    if (editableDiv.value) {
      editableDiv.value.innerHTML = ''
    }
    userRequirement.value = ''
  }
  
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