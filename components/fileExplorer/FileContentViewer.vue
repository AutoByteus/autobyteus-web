<template>
  <div id="contentViewer" class="bg-white rounded-lg shadow-md p-4">
    <div class="flex border-b mb-4 overflow-x-auto">
      <button 
        v-for="file in openFiles" 
        :key="file"
        @click="setActiveFile(file)"
        :class="['px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50', 
                 file === activeFile ? 'bg-gray-200 text-gray-800' : 'text-gray-600 hover:bg-gray-100']"
      >
        {{ getFileName(file) }}
        <span @click.stop="closeFile(file)" class="ml-2 text-gray-500 hover:text-gray-700">&times;</span>
      </button>
    </div>
    <div v-if="activeFile">
      <h2 class="text-lg font-semibold mb-2 text-gray-700">{{ getFileName(activeFile) }}</h2>
      <div v-if="isContentLoading(activeFile)" class="text-center py-4">
        <p class="text-gray-600">Loading file content...</p>
      </div>
      <div v-else-if="getContentError(activeFile)" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong class="font-bold">Error!</strong>
        <span class="block sm:inline">{{ getContentError(activeFile) }}</span>
      </div>
      <div v-else-if="getFileContent(activeFile)" class="bg-gray-50 p-4 rounded-lg text-gray-600 whitespace-pre-wrap">
        {{ getFileContent(activeFile) }}
      </div>
    </div>
    <div v-else class="text-center py-4">
      <p class="text-gray-600">No file selected</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useFileExplorerStore } from '~/stores/fileExplorer';

const fileExplorerStore = useFileExplorerStore();

const openFiles = computed(() => fileExplorerStore.getOpenFiles);
const activeFile = computed(() => fileExplorerStore.getActiveFile);

const getFileName = (filePath: string) => filePath.split('/').pop() || filePath;

const setActiveFile = (filePath: string) => fileExplorerStore.setActiveFile(filePath);
const closeFile = (filePath: string) => fileExplorerStore.closeFile(filePath);

const getFileContent = (filePath: string) => fileExplorerStore.getFileContent(filePath);
const isContentLoading = (filePath: string) => fileExplorerStore.isContentLoading(filePath);
const getContentError = (filePath: string) => fileExplorerStore.getContentError(filePath);
</script>

<style scoped>
/* Add any necessary styles here */
</style>