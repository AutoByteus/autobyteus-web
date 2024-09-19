<template>
  <div class="context-file-path-list">
    <div class="flex justify-end mb-2">
      <button 
        @click="clearAllPaths" 
        class="px-2 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition duration-300"
        v-if="contextFilePaths.length > 0"
      >
        Clear All
      </button>
    </div>
    <ul class="space-y-2">
      <li v-for="(filePath, index) in contextFilePaths" :key="filePath" class="bg-gray-100 p-2 rounded">
        <div class="flex items-center space-x-2">
          <i class="fas fa-file text-gray-500 w-4 flex-shrink-0"></i>
          <span class="text-sm text-gray-600 truncate">
            {{ filePath }}
          </span>
          <button @click="removePath(index)" class="text-red-500 hover:text-red-700 ml-auto">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useWorkflowStore } from '~/stores/workflow'

const workflowStore = useWorkflowStore()

const contextFilePaths = computed(() => workflowStore.contextFilePaths)

const removePath = (index: number) => {
  workflowStore.removeContextFilePath(index)
}

const clearAllPaths = () => {
  workflowStore.clearAllContextFilePaths()
}
</script>