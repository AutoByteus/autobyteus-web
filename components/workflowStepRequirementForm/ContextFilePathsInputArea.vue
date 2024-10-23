<template>
  <div
    class="w-full bg-white rounded-md border border-gray-200 hover:shadow-md transition-shadow duration-200 p-4"
    @dragover.prevent
    @drop.prevent="onFileDrop"
    @paste="onPaste"
  >
    <div 
      class="flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors duration-300 p-2"
      @click="toggleCollapse"
    >
      <div class="flex items-center space-x-2">
        <button 
          class="p-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <i :class="['fas', isCollapsed ? 'fa-chevron-right' : 'fa-chevron-down', 'text-gray-500']"></i>
        </button>
        <span class="text-sm font-medium text-gray-700">Context Files ({{ contextFilePaths.length }})</span>
        <span class="text-xs text-gray-500">(drag and drop or paste)</span>
      </div>
    </div>
    <transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div v-show="!isCollapsed || contextFilePaths.length === 0" class="mt-2">
        <ul v-if="contextFilePaths.length > 0" class="space-y-2">
          <li 
            v-for="(filePath, index) in contextFilePaths" 
            :key="filePath.path" 
            class="bg-gray-100 p-2 rounded transition-colors duration-300 animate-fadeIn flex items-center justify-between"
          >
            <div class="flex items-center space-x-2 flex-grow">
              <i :class="['fas', filePath.type === 'image' ? 'fa-image' : 'fa-file', 'text-gray-500 w-4 flex-shrink-0']"></i>
              <span class="text-sm text-gray-600 truncate">{{ filePath.path }}</span>
              <span v-if="uploadingFiles.includes(filePath.path)" class="text-xs text-blue-500">
                <i class="fas fa-spinner fa-spin mr-1"></i>Uploading...
              </span>
            </div>
            <button 
              @click.stop="removeContextFilePath(index)" 
              class="text-red-500 hover:text-white hover:bg-red-500 transition-colors duration-300 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500"
              title="Remove this file"
              aria-label="Remove file"
              :disabled="uploadingFiles.includes(filePath.path)"
            >
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </li>
        </ul>
        <div v-else class="text-center text-sm text-gray-500 py-2">
          Drag and drop files here or paste images to add context
        </div>
        <div v-if="contextFilePaths.length > 0" class="flex justify-end mt-4">
          <button 
            @click.stop="clearAllContextFilePaths" 
            class="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-300 flex items-center"
          >
            <i class="fas fa-trash-alt mr-2"></i>
            Clear All
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useWorkflowStepStore } from '~/stores/workflowStep'
import { getFilePathsFromFolder, determineFileType } from '~/utils/fileExplorer/fileUtils'
import type { TreeNode } from '~/utils/fileExplorer/TreeNode'
import type { ContextFilePath } from '~/types/conversation'

const workflowStepStore = useWorkflowStepStore()

const contextFilePaths = computed(() => workflowStepStore.currentContextPaths)
const isCollapsed = ref(contextFilePaths.value.length === 0)
const uploadingFiles = ref<string[]>([])

const toggleCollapse = () => {
  if (contextFilePaths.value.length > 0) {
    isCollapsed.value = !isCollapsed.value
  }
}

const addContextFilePath = (filePath: string, fileType: 'text' | 'image') => {
  workflowStepStore.addContextFilePath({ path: filePath, type: fileType })
  isCollapsed.value = false
}

const removeContextFilePath = (index: number) => {
  workflowStepStore.removeContextFilePath(index)
  if (contextFilePaths.value.length === 0) {
    isCollapsed.value = true
  }
}

const clearAllContextFilePaths = () => {
  workflowStepStore.clearContextFilePaths()
  isCollapsed.value = true
}

const onFileDrop = async (event: DragEvent) => {
  const dragData = event.dataTransfer?.getData('application/json')
  if (dragData) {
    const droppedNode: TreeNode = JSON.parse(dragData)
    const filePaths = getFilePathsFromFolder(droppedNode)
    for (const filePath of filePaths) {
      const fileType = await determineFileType(filePath)
      addContextFilePath(filePath, fileType)
    }
  } else if (event.dataTransfer?.files.length) {
    for (const file of event.dataTransfer.files) {
      const tempPath = URL.createObjectURL(file)
      const fileType = file.type.startsWith('image/') ? 'image' : 'text'
      addContextFilePath(tempPath, fileType)
      uploadingFiles.value.push(tempPath)
      
      try {
        const uploadedFilePath = await workflowStepStore.uploadFile(file)
        uploadingFiles.value = uploadingFiles.value.filter(path => path !== tempPath)
        workflowStepStore.removeContextFilePath(contextFilePaths.value.findIndex(cf => cf.path === tempPath))
        addContextFilePath(uploadedFilePath, fileType)
      } catch (error) {
        console.error('Error uploading file:', error)
        workflowStepStore.removeContextFilePath(contextFilePaths.value.findIndex(cf => cf.path === tempPath))
        uploadingFiles.value = uploadingFiles.value.filter(path => path !== tempPath)
      }
    }
  }
  isCollapsed.value = false
}

const onPaste = async (event: ClipboardEvent) => {
  const items = event.clipboardData?.items
  if (items) {
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const blob = item.getAsFile()
        if (blob) {
          const tempPath = URL.createObjectURL(blob)
          addContextFilePath(tempPath, 'image')
          uploadingFiles.value.push(tempPath)
          
          try {
            const uploadedFilePath = await workflowStepStore.uploadFile(blob)
            uploadingFiles.value = uploadingFiles.value.filter(path => path !== tempPath)
            workflowStepStore.removeContextFilePath(contextFilePaths.value.findIndex(cf => cf.path === tempPath))
            addContextFilePath(uploadedFilePath, 'image')
          } catch (error) {
            console.error('Error uploading pasted image:', error)
            workflowStepStore.removeContextFilePath(contextFilePaths.value.findIndex(cf => cf.path === tempPath))
            uploadingFiles.value = uploadingFiles.value.filter(path => path !== tempPath)
          }
        }
      }
    }
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

.min-h-0 {
  min-height: 0;
}
</style>