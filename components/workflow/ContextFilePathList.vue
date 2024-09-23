<template>
  <div>
    <div 
      class="mb-4 bg-gray-50 rounded-md overflow-hidden border border-gray-200 hover:shadow-md transition-shadow duration-200"
      @dragover.prevent
      @drop.prevent="onFileDrop"
    >
      <div 
        class="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-100 transition-colors duration-300"
      >
        <div class="flex items-center">
          <button 
            @click="toggleCollapse" 
            class="mr-2 p-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <i :class="['fas', isCollapsed ? 'fa-chevron-right' : 'fa-chevron-down', 'text-gray-500']"></i>
          </button>
          <span class="text-sm font-medium text-gray-700">Context Files ({{ contextFilePaths.length }})</span>
        </div>
      </div>
      <div v-show="!isCollapsed" class="p-3 border-t border-gray-200">
        <ul class="space-y-2">
          <li 
            v-for="(filePath, index) in contextFilePaths" 
            :key="filePath" 
            class="bg-gray-100 p-2 rounded hover:bg-gray-200 transition-colors duration-300 animate-fadeIn group flex items-center justify-between"
          >
            <div class="flex items-center space-x-2 flex-grow">
              <i class="fas fa-file text-gray-500 w-4 flex-shrink-0"></i>
              <span class="text-sm text-gray-600 truncate">
                {{ filePath }}
              </span>
            </div>
            <button 
              @click="removeContextFilePath(index)" 
              class="text-gray-400 hover:text-red-500 transition-colors duration-300 p-1 rounded-full hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500"
              title="Remove this file"
            >
              <i class="fas fa-times"></i>
              <span class="sr-only">Remove file</span>
            </button>
          </li>
        </ul>
        <div class="flex justify-end mt-4">
          <button 
            @click="clearAllContextFilePaths" 
            class="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-300 flex items-center"
          >
            <i class="fas fa-trash-alt mr-2"></i>
            Clear All
          </button>
        </div>
      </div>
    </div>

    <div 
      v-if="contextFilePaths.length === 0"
      @dragover.prevent
      @drop.prevent="onFileDrop"
      class="mb-4 bg-gray-50 rounded-md border border-gray-200 p-3 text-center text-sm text-gray-500 hover:bg-gray-100 transition-colors duration-300 cursor-pointer"
    >
      Drag and drop files here to add context
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useWorkflowStore } from '~/stores/workflow'
import { getFilePathsFromFolder } from '~/utils/fileExplorer/fileUtils'
import type { TreeNode } from '~/utils/fileExplorer/TreeNode'

const workflowStore = useWorkflowStore()

const contextFilePaths = computed(() => workflowStore.contextFilePaths)
const isCollapsed = ref(false)

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

const addContextFilePath = (filePath: string) => {
  workflowStore.addContextFilePath(filePath)
}

const removeContextFilePath = (index: number) => {
  workflowStore.removeContextFilePath(index)
}

const clearAllContextFilePaths = () => {
  workflowStore.clearAllContextFilePaths()
}

const onFileDrop = (event: DragEvent) => {
  const dragData = event.dataTransfer?.getData('application/json')
  if (dragData) {
    const droppedNode: TreeNode = JSON.parse(dragData)
    const filePaths = getFilePathsFromFolder(droppedNode)
    filePaths.forEach(filePath => {
      addContextFilePath(filePath)
    })
  }
  isCollapsed.value = false
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