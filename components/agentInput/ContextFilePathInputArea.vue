<template>
  <div
    class="bg-gray-50 hover:shadow-md transition-shadow duration-200 p-4 border border-gray-200"
    @dragover.prevent
    @drop.prevent="onFileDrop"
    @paste="onPaste"
    data-file-drop-target="true"
    ref="dropAreaRef"
  >
    <!-- Hidden file input for upload button -->
    <input
      ref="fileInputRef"
      type="file"
      multiple
      class="hidden"
      @change="onFileSelect"
      :disabled="!activeContextStore.activeAgentContext"
    />

    <!-- Clickable Header Area -->
    <div
      class="flex items-center justify-between p-2 -m-2 mb-1 rounded"
      :class="{ 'mb-2': isContextListExpanded && contextFilePaths.length > 0 }"
    >
      <div
        @click="toggleContextList"
        class="flex items-center flex-grow cursor-pointer p-1 -m-1 rounded hover:bg-gray-100 transition-colors"
        role="button"
        :aria-expanded="isContextListExpanded.toString()"
        aria-controls="context-file-list"
      >
        <div class="flex items-center">
          <!-- Chevron icon is now conditional -->
          <svg
            vif="contextFilePaths.length > 0"
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
          <span v-if="contextFilePaths.length === 0" class="text-xs text-gray-500 ml-1.5"> (drag, paste, or upload)</span>
        </div>
      </div>
      
      <!-- Upload Button -->
      <button
        @click.stop="triggerFileInput"
        class="text-blue-500 hover:text-white hover:bg-blue-500 transition-colors duration-300 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 ml-2 flex-shrink-0"
        title="Upload files"
        aria-label="Upload files"
        :disabled="!activeContextStore.activeAgentContext"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 6V18M18 12H6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
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
        class="bg-gray-100 p-2 rounded transition-colors duration-300 flex items-center justify-between hover:bg-gray-200 group"
      >
        <div class="flex items-center space-x-2 flex-grow min-w-0">
          <i :class="['fas', getIconForFileType(filePath.type), 'text-gray-500 w-4 flex-shrink-0']"></i>
          <span
            class="text-sm text-gray-600 truncate group-hover:underline cursor-pointer"
            @click="handleContextFileClick(filePath)"
          >
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
import { storeToRefs } from 'pinia';
import { useActiveContextStore } from '~/stores/activeContextStore';
import { useFileUploadStore } from '~/stores/fileUploadStore';
import { useServerStore } from '~/stores/serverStore';
import { useFileExplorerStore } from '~/stores/fileExplorer';
import { getFilePathsFromFolder, determineFileType } from '~/utils/fileExplorer/fileUtils';
import type { TreeNode } from '~/utils/fileExplorer/TreeNode';
import type { ContextFilePath } from '~/types/conversation';

const activeContextStore = useActiveContextStore();
const fileUploadStore = useFileUploadStore();
const serverStore = useServerStore();
const fileExplorerStore = useFileExplorerStore();
const { isElectron } = storeToRefs(serverStore);

const contextFilePaths = computed(() => activeContextStore.currentContextPaths);
const uploadingFiles = ref<string[]>([]);
const isContextListExpanded = ref(true);
const fileInputRef = ref<HTMLInputElement | null>(null);

const getIconForFileType = (type: ContextFilePath['type']) => {
  switch (type) {
    case 'Image':
      return 'fa-image';
    case 'Audio':
      return 'fa-file-audio';
    case 'Video':
      return 'fa-file-video';
    default:
      return 'fa-file';
  }
};

const toggleContextList = () => {
  if (contextFilePaths.value.length > 0) {
    isContextListExpanded.value = !isContextListExpanded.value;
  } else {
    isContextListExpanded.value = true;
  }
};

const handleContextFileClick = (filePath: ContextFilePath) => {
  if (uploadingFiles.value.includes(filePath.path)) {
    return;
  }
  fileExplorerStore.openFile(filePath.path);
};

const removeContextFilePath = (index: number) => {
  activeContextStore.removeContextFilePath(index);
};

const clearAllContextFilePaths = () => {
  activeContextStore.clearContextFilePaths();
  isContextListExpanded.value = true;
};

const processAndUploadFiles = async (files: (File | null)[]) => {
  if (!activeContextStore.activeAgentContext) return;

  const validFiles = files.filter((f): f is File => f !== null);
  if (validFiles.length === 0) {
    return;
  }
  
  if (!isContextListExpanded.value) {
    isContextListExpanded.value = true;
  }

  const uploadPromises = validFiles.map(async (file) => {
    const tempPath = URL.createObjectURL(file);
    
    let fileType: ContextFilePath['type'];
    if (file.type.startsWith('image/')) fileType = 'Image';
    else if (file.type.startsWith('audio/')) fileType = 'Audio';
    else if (file.type.startsWith('video/')) fileType = 'Video';
    else fileType = 'Text';

    activeContextStore.addContextFilePath({ path: tempPath, type: fileType });
    uploadingFiles.value.push(tempPath);

    try {
      const uploadedFilePath = await fileUploadStore.uploadFile(file);
      const tempIndex = contextFilePaths.value.findIndex(cf => cf.path === tempPath);
      if (tempIndex !== -1) {
        activeContextStore.removeContextFilePath(tempIndex);
      }
      activeContextStore.addContextFilePath({ path: uploadedFilePath, type: fileType });
    } catch (error) {
      console.error('Error uploading file:', error);
      const tempIndex = contextFilePaths.value.findIndex(cf => cf.path === tempPath);
      if (tempIndex !== -1) {
        activeContextStore.removeContextFilePath(tempIndex);
      }
    } finally {
      uploadingFiles.value = uploadingFiles.value.filter(path => path !== tempPath);
    }
  });

  await Promise.all(uploadPromises);
};

const triggerFileInput = () => {
  if (activeContextStore.activeAgentContext) {
    fileInputRef.value?.click();
  }
};

const onFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files) {
    processAndUploadFiles(Array.from(input.files));
  }
  input.value = '';
};

const onFileDrop = async (event: DragEvent) => {
  if (!activeContextStore.activeAgentContext) return;

  const dataTransfer = event.dataTransfer;
  const dragData = dataTransfer?.getData('application/json');

  if (dragData) {
    console.log('[INFO] Drop event is from internal file explorer.');
    const droppedNode: TreeNode = JSON.parse(dragData);
    const filePaths = getFilePathsFromFolder(droppedNode);
    for (const filePath of filePaths) {
      const fileType = await determineFileType(filePath);
      activeContextStore.addContextFilePath({ path: filePath, type: fileType });
    }
    if (filePaths.length > 0 && !isContextListExpanded.value) {
      isContextListExpanded.value = true;
    }
  } else if (isElectron.value && dataTransfer?.files?.length) {
    console.log('[INFO] Drop event from native OS in Electron.');
    const files = Array.from(dataTransfer.files);
    const pathPromises = files.map(f => window.electronAPI?.getPathForFile(f));
    const paths = (await Promise.all(pathPromises)).filter((p): p is string => Boolean(p));
    
    console.log('[INFO] Received native file paths from preload bridge:', paths);
    for (const path of paths) {
      const fileType = await determineFileType(path);
      activeContextStore.addContextFilePath({ path, type: fileType });
    }
    if (paths.length > 0 && !isContextListExpanded.value) {
      isContextListExpanded.value = true;
    }
  } else if (!isElectron.value && dataTransfer?.files?.length) {
    console.log('[INFO] Drop event from native OS in browser, uploading files.');
    await processAndUploadFiles(Array.from(dataTransfer.files));
  }
};

const onPaste = async (event: ClipboardEvent) => {
  if (!activeContextStore.activeAgentContext) return;

  const clipboardData = event.clipboardData;
  if (!clipboardData) return;

  const items = clipboardData.items;
  if (items) {
    const fileLikes = Array.from(items)
      .filter(item => item.kind === 'file')
      .map(item => item.getAsFile());

    // Check if there are actual files to process
    if (fileLikes.some(f => f !== null)) {
      event.preventDefault();
      await processAndUploadFiles(fileLikes);
      return; // Prioritize file pasting
    }
  }

  // Fallback to handle pasting text paths if no files were found
  const pastedText = clipboardData.getData('text/plain');
  if (pastedText && pastedText.trim()) {
    event.preventDefault();
    const paths = pastedText.split(/\r?\n/).map(p => p.trim()).filter(Boolean);
    
    if (paths.length > 0) {
      if (!isContextListExpanded.value) {
        isContextListExpanded.value = true;
      }
      for (const path of paths) {
        const fileType = await determineFileType(path);
        activeContextStore.addContextFilePath({ path, type: fileType });
      }
    }
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
