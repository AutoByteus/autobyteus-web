<template>
  <div
    class="bg-gray-50 hover:shadow-md transition-shadow duration-200 p-4 border border-gray-200"
    @dragover.prevent
    @drop.prevent="onFileDrop"
    @paste="onPaste"
  >
    <!-- Clickable Header Area -->
    <div
      @click="toggleContextList"
      class="flex items-center justify-between cursor-pointer p-2 -m-2 mb-1 rounded hover:bg-gray-100 transition-colors"
      :class="{ 'mb-2': isContextListExpanded && contextFilePaths.length > 0 }"
      role="button"
      :aria-expanded="isContextListExpanded.toString()"
      aria-controls="context-file-list"
    >
      <div class="flex items-center">
        <!-- Chevron icon is now conditional -->
        <svg
          v-if="contextFilePaths.length > 0"
          class="w-5 h-5 transform transition-transform text-gray-600 mr-2 flex-shrink-0"
          :class="{ 'rotate-90': isContextListExpanded }"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
        </svg>
        <span class="font-medium text-sm text-gray-800" :class="{ 'ml-7': contextFilePaths.length === 0 }">
          Context Files ({{ contextFilePaths.length }})
        </span>
        <span v-if="contextFilePaths.length === 0" class="text-xs text-gray-500 ml-1.5"> (drag and drop or paste)</span>
      </div>
      <!-- Placeholder for any right-aligned item in header if needed in future -->
    </div>

    <!-- File List (conditionally rendered) -->
    <ul
      v-if="isContextListExpanded && contextFilePaths.length > 0"
      id="context-file-list"
      class="space-y-2"
    >
      <li
        v-for="(filePath, index) in contextFilePaths"
        :key="filePath.path"
        class="bg-gray-100 p-2 rounded transition-colors duration-300 flex items-center justify-between"
      >
        <div class="flex items-center space-x-2 flex-grow min-w-0">
          <i :class="['fas', filePath.type === 'Image' ? 'fa-image' : 'fa-file', 'text-gray-500 w-4 flex-shrink-0']"></i>
          <span class="text-sm text-gray-600 truncate">
            {{ filePath.path }}
          </span>
          <span v-if="uploadingFiles.includes(filePath.path)" class="text-xs text-blue-500 ml-auto flex-shrink-0">
            <i class="fas fa-spinner fa-spin mr-1"></i>Uploading...
          </span>
        </div>
        <button
          @click.stop="removeContextFilePath(index)"
          class="text-red-500 hover:text-white hover:bg-red-500 transition-colors duration-300 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500 ml-2 flex-shrink-0"
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

    <!-- "Clear All" Button Footer (conditionally rendered) -->
    <div v-if="contextFilePaths.length > 0" class="flex justify-end pt-2 mt-2">
      <button
        @click.stop="clearAllContextFilePaths"
        class="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-300 flex items-center text-xs"
      >
        <i class="fas fa-trash-alt mr-2"></i>
        Clear All
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useConversationStore } from '~/stores/conversationStore';
import { getFilePathsFromFolder, determineFileType } from '~/utils/fileExplorer/fileUtils';
import type { TreeNode } from '~/utils/fileExplorer/TreeNode';

const conversationStore = useConversationStore();

const contextFilePaths = computed(() => conversationStore.currentContextPaths);
const uploadingFiles = ref<string[]>([]);
const isContextListExpanded = ref(true);

const toggleContextList = () => {
  if (contextFilePaths.value.length > 0) {
    isContextListExpanded.value = !isContextListExpanded.value;
  } else {
    isContextListExpanded.value = true;
  }
};

const removeContextFilePath = (index: number) => {
  conversationStore.removeContextFilePath(index);
};

const addFileAndExpand = (filePath: string, fileType: 'Text' | 'Image') => {
  conversationStore.addContextFilePath({ path: filePath, type: fileType });
  if (!isContextListExpanded.value) {
    isContextListExpanded.value = true;
  }
};


const clearAllContextFilePaths = () => {
  conversationStore.clearContextFilePaths();
  isContextListExpanded.value = true;
};

const onFileDrop = async (event: DragEvent) => {
  let filesWereAdded = false;
  const dragData = event.dataTransfer?.getData('application/json');
  if (dragData) {
    filesWereAdded = true;
    const droppedNode: TreeNode = JSON.parse(dragData);
    const filePaths = getFilePathsFromFolder(droppedNode);
    for (const filePath of filePaths) {
      // CLEANUP: No workaround needed here. `determineFileType` now returns the correct PascalCase type.
      const fileType = await determineFileType(filePath);
      conversationStore.addContextFilePath({ path: filePath, type: fileType });
    }
  } else if (event.dataTransfer?.files.length) {
    filesWereAdded = true;
    for (const file of event.dataTransfer.files) {
      const tempPath = URL.createObjectURL(file);
      const fileType = file.type.startsWith('image/') ? 'Image' : 'Text';
      conversationStore.addContextFilePath({ path: tempPath, type: fileType });
      uploadingFiles.value.push(tempPath);

      try {
        const uploadedFilePath = await conversationStore.uploadFile(file);
        const tempIndex = contextFilePaths.value.findIndex(cf => cf.path === tempPath);
        if (tempIndex !== -1) {
          conversationStore.removeContextFilePath(tempIndex);
        }
        conversationStore.addContextFilePath({ path: uploadedFilePath, type: fileType });
        uploadingFiles.value = uploadingFiles.value.filter(path => path !== tempPath && path !== uploadedFilePath);


      } catch (error) {
        console.error('Error uploading file:', error);
        const tempIndex = contextFilePaths.value.findIndex(cf => cf.path === tempPath);
        if (tempIndex !== -1) {
          conversationStore.removeContextFilePath(tempIndex);
        }
        uploadingFiles.value = uploadingFiles.value.filter(path => path !== tempPath);
      }
    }
  }

  if (filesWereAdded && !isContextListExpanded.value) {
     isContextListExpanded.value = true;
  }
};

const onPaste = async (event: ClipboardEvent) => {
  let pastedContent = false;
  const items = event.clipboardData?.items;
  if (items) {
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        pastedContent = true;
        const blob = item.getAsFile();
        if (blob) {
          const tempPath = URL.createObjectURL(blob);
          conversationStore.addContextFilePath({ path: tempPath, type: 'Image' });
          uploadingFiles.value.push(tempPath);

          try {
            const uploadedFilePath = await conversationStore.uploadFile(blob);
            const tempIndex = contextFilePaths.value.findIndex(cf => cf.path === tempPath);
            if (tempIndex !== -1) {
               conversationStore.removeContextFilePath(tempIndex);
            }
            conversationStore.addContextFilePath({ path: uploadedFilePath, type: 'Image' });
            uploadingFiles.value = uploadingFiles.value.filter(path => path !== tempPath && path !== uploadedFilePath);

          } catch (error) {
            console.error('Error uploading pasted image:', error);
            const tempIndex = contextFilePaths.value.findIndex(cf => cf.path === tempPath);
            if (tempIndex !== -1) {
              conversationStore.removeContextFilePath(tempIndex);
            }
            uploadingFiles.value = uploadingFiles.value.filter(path => path !== tempPath);
          }
        }
      }
    }
  }
  if (pastedContent && !isContextListExpanded.value) {
      isContextListExpanded.value = true;
  }
};

watch(contextFilePaths, (newPaths) => {
    if (newPaths.length === 0 && !isContextListExpanded.value) {
        isContextListExpanded.value = true;
    }
}, { deep: true });

</script>

<style scoped>
/* No specific styles needed here now */
</style>
