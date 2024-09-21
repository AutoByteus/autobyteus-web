<template>
  <div class="context-file-path-list">
    <transition-group name="list" tag="ul" class="space-y-2">
      <li v-for="(filePath, index) in contextFilePaths" :key="filePath" class="bg-gray-100 p-2 rounded hover:bg-gray-200 transition duration-300">
        <div class="flex items-center space-x-2">
          <i class="fas fa-file text-gray-500 w-4 flex-shrink-0"></i>
          <span class="text-sm text-gray-600 truncate flex-grow">
            {{ filePath }}
          </span>
          <button @click="removePath(index)" class="text-red-500 hover:text-red-700 transition duration-300">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </li>
    </transition-group>
    <div class="flex justify-end mt-4">
      <button 
        v-if="contextFilePaths.length > 0"
        @click="clearAllPaths" 
        class="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-300 flex items-center"
      >
        <i class="fas fa-trash-alt mr-2"></i>
        Clear All
      </button>
    </div>
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

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>