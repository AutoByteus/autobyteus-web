<template>
    <div class="user-requirement-input border border-gray-300 rounded-lg p-4 shadow-sm">
      <div 
        class="mb-4 bg-gray-50 rounded-md overflow-hidden border border-gray-200"
        @dragover.prevent
        @drop.prevent="onFileDrop"
      >
        <div 
          @click="toggleCollapse"
          class="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-100 transition duration-300"
        >
          <div class="flex items-center">
            <i :class="['fas', isCollapsed ? 'fa-chevron-right' : 'fa-chevron-down', 'mr-2 text-gray-500']"></i>
            <span class="text-sm font-medium text-gray-700">Context Files ({{ contextFilePaths.length }})</span>
          </div>
          <span class="text-sm text-gray-500">Drop files here</span>
        </div>
        <div v-show="!isCollapsed" class="p-3 border-t border-gray-200">
          <ContextFilePathList
            :contextFilePaths="contextFilePaths"
            @removePath="removePath"
            @clearAllPaths="clearAllPaths"
          />
        </div>
      </div>
  
      <div class="relative">
        <textarea
          v-model="userRequirement"
          ref="textarea"
          class="w-full p-4 pr-[5.5rem] pb-16 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none overflow-hidden bg-white"
          :style="{ height: textareaHeight + 'px' }"
          placeholder="Enter your requirement here..."
          @input="adjustTextareaHeight"
        ></textarea>
        <button 
          @click="handleSend"
          :disabled="isSending || !userRequirement.trim()"
          class="absolute bottom-4 right-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-sm"
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
  import { ref, computed, onMounted, nextTick } from 'vue'
  import { useWorkflowStore } from '~/stores/workflow'
  import { useWorkflowStepStore } from '~/stores/workflowStep'
  import { useWorkspaceStore } from '~/stores/workspace'
  import ContextFilePathList from '~/components/workflow/ContextFilePathList.vue'
  import { getFilePathsFromFolder } from '~/utils/fileExplorer/fileUtils'
  import type { TreeNode } from '~/utils/fileExplorer/TreeNode'
  
  const workflowStore = useWorkflowStore()
  const workflowStepStore = useWorkflowStepStore()
  const workspaceStore = useWorkspaceStore()
  
  const contextFilePaths = computed(() => workflowStore.contextFilePaths)
  const isSending = computed(() => workflowStepStore.isCurrentlySending)
  const userRequirement = ref('')
  const isCollapsed = ref(false)
  const textarea = ref<HTMLTextAreaElement | null>(null)
  const textareaHeight = ref(100) // Initial height
  
  const toggleCollapse = () => {
    isCollapsed.value = !isCollapsed.value
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
    isCollapsed.value = false
  }
  
  const removePath = (index: number) => {
    workflowStore.removeContextFilePath(index)
  }
  
  const clearAllPaths = () => {
    workflowStore.clearAllContextFilePaths()
  }
  
  const handleSend = async () => {
    if (!userRequirement.value.trim()) {
      alert('Please enter a user requirement before sending.')
      return
    }
  
    const workspaceRootPath = workspaceStore.currentSelectedWorkspacePath
    const stepId = workflowStore.selectedStep?.id
  
    if (!workspaceRootPath || !stepId) {
      alert('Workspace or step is not selected.')
      return
    }
  
    try {
      await workflowStepStore.sendStepRequirementAndSubscribe(
        workspaceRootPath,
        stepId,
        contextFilePaths.value,
        userRequirement.value
      )
  
      const payload = {
        text: userRequirement.value,
        contextFilePaths: [...contextFilePaths.value],
        timestamp: new Date()
      }
  
      workflowStepStore.addUserMessage(payload)
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
  
  onMounted(() => {
    nextTick(() => {
      adjustTextareaHeight()
    })
  })
  </script>
  
  <style scoped>
  .user-requirement-input textarea {
    transition: border-color 0.3s, box-shadow 0.3s;
  }
  
  .user-requirement-input button {
    transition: background-color 0.3s, opacity 0.3s;
  }
  </style>