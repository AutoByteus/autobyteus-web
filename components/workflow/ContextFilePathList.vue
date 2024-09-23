<template>
  <div
    class="mb-4 bg-gray-50 rounded-md overflow-hidden border border-gray-200 hover:shadow-md transition-shadow duration-200"
    @dragover.prevent
    @drop.prevent="onFileDrop"
  >
    <div 
      class="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-100 transition-colors duration-300"
      @click="toggleCollapse"
    >
      <div class="flex items-center space-x-2">
        <button 
          class="p-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <i :class="['fas', isCollapsed ? 'fa-chevron-right' : 'fa-chevron-down', 'text-gray-500']"></i>
        </button>
        <span class="text-sm font-medium text-gray-700">Context Files ({{ contextFilePaths.length }})</span>
        <span class="text-xs text-gray-500">(drag and drop)</span>
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
      <div v-show="!isCollapsed || contextFilePaths.length === 0" class="p-3 border-t border-gray-200">
        <ul v-if="contextFilePaths.length > 0" class="space-y-2">
          <li 
            v-for="(filePath, index) in contextFilePaths" 
            :key="filePath" 
            class="bg-gray-100 p-2 rounded transition-colors duration-300 animate-fadeIn flex items-center justify-between"
          >
            <div class="flex items-center space-x-2 flex-grow">
              <i class="fas fa-file text-gray-500 w-4 flex-shrink-0"></i>
              <span class="text-sm text-gray-600 truncate">
                {{ filePath }}
              </span>
            </div>
            <button 
              @click.stop="removeContextFilePath(index)" 
              class="text-red-500 bg-red-100 hover:bg-red-200 transition-colors duration-300 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500"
              title="Remove this file"
              aria-label="Remove file"
            >
              <i class="fas fa-times"></i>
            </button>
          </li>
        </ul>
        <div v-else class="text-center text-sm text-gray-500 py-2">
          Drag and drop files here to add context
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
import { useWorkflowStore } from '~/stores/workflow'
import { getFilePathsFromFolder } from '~/utils/fileExplorer/fileUtils'
import type { TreeNode } from '~/utils/fileExplorer/TreeNode'

const workflowStore = useWorkflowStore()

const contextFilePaths = computed(() => workflowStore.contextFilePaths)
const isCollapsed = ref(contextFilePaths.value.length === 0)

const toggleCollapse = () => {
  if (contextFilePaths.value.length > 0) {
    isCollapsed.value = !isCollapsed.value
  }
}

const addContextFilePath = (filePath: string) => {
  workflowStore.addContextFilePath(filePath)
  isCollapsed.value = false
}

const removeContextFilePath = (index: number) => {
  workflowStore.removeContextFilePath(index)
  if (contextFilePaths.value.length === 0) {
    isCollapsed.value = true
  }
}

const clearAllContextFilePaths = () => {
  workflowStore.clearAllContextFilePaths()
  isCollapsed.value = true
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