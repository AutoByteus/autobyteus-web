<template>
  <div
    id="contentViewer"
    class="bg-white rounded-lg shadow-md flex flex-col h-full"
    ref="contentRef"
    v-if="isFullscreenMode || (!isFullscreenMode && !isMinimizedMode)"
  >
    <!-- Tabs for open files across the top -->
    <div class="flex border-b overflow-x-auto sticky top-0 bg-white z-10 p-2">
      <div 
        v-for="file in openFiles" 
        :key="file"
        @click="setActiveFile(file)"
        role="button"
        tabindex="0"
        @keyup.enter="setActiveFile(file)"
        :class="[
          'px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center gap-2', 
          file === activeFile ? 'bg-gray-200 text-gray-800' : 'text-gray-600 hover:bg-gray-100'
        ]"
      >
        <span class="truncate">{{ getFileName(file) }}</span>
        <button 
          @click.stop="closeFile(file)" 
          class="close-button ml-1 w-5 h-5 flex items-center justify-center rounded-full hover:bg-red-100 transition-colors"
          aria-label="Close file"
        >
          <span class="text-base leading-none text-red-500 hover:text-red-600">&times;</span>
        </button>
      </div>
    </div>

    <!-- If no file is active, show placeholder -->
    <div v-if="!activeFile" class="flex-1 text-center py-4 flex items-center justify-center">
      <p class="text-gray-600">No file selected</p>
    </div>

    <!-- Main content area -->
    <div v-else class="flex-1 flex flex-col min-h-0">
      <div v-if="activeFileData?.isLoading" class="flex-1 text-center py-4 flex items-center justify-center">
        <p class="text-gray-600">Loading file content...</p>
      </div>
      <div v-else-if="activeFileData?.error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative m-4" role="alert">
        <strong class="font-bold">Error!</strong>
        <span class="block sm:inline">{{ activeFileData.error }}</span>
      </div>
      <!-- DYNAMIC COMPONENT RENDERER -->
      <div v-else-if="activeFileData && activeViewerComponent" class="flex-1 bg-gray-50 rounded-lg overflow-hidden relative">
        <component
          :is="activeViewerComponent"
          v-bind="viewerProps"
          @update:model-value="fileContent = $event"
          @save="handleSave"
          class="h-full w-full"
        />
        <!-- Save indicators for Text editor -->
        <template v-if="activeFileData.type === 'Text'">
          <div v-if="saveError" class="absolute bottom-2 left-2 text-red-600 bg-white px-2 py-1 rounded shadow">
            {{ saveError }}
          </div>
          <div v-if="isSaving" class="absolute bottom-2 right-2 text-gray-600 bg-white px-2 py-1 rounded shadow">
            Saving...
          </div>
          <div v-if="showSaveSuccess" class="absolute bottom-2 right-2 text-green-600 bg-white px-2 py-1 rounded shadow">
            Changes saved
          </div>
        </template>
      </div>
      <div v-else class="flex-1 text-center py-4 flex items-center justify-center">
        <p class="text-gray-500">Unsupported file type. Cannot display.</p>
      </div>
    </div>

    <!-- Show minimize hint when in fullscreen mode -->
    <div v-if="isFullscreenMode" class="border-t p-2 flex justify-end items-center">
      <small class="text-gray-700 font-medium">Press <kbd class="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded">Esc</kbd> to minimize</small>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, ref, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { useFileExplorerStore } from '~/stores/fileExplorer'
import { useWorkspaceStore } from '~/stores/workspace'
import { useFileContentDisplayModeStore } from '~/stores/fileContentDisplayMode'
import { getLanguage } from '~/utils/aiResponseParser/languageDetector'

// Import all potential viewer components
import MonacoEditor from '~/components/fileExplorer/MonacoEditor.vue'
import ImageViewer from '~/components/fileExplorer/viewers/ImageViewer.vue'
import AudioPlayer from '~/components/fileExplorer/viewers/AudioPlayer.vue'
import VideoPlayer from '~/components/fileExplorer/viewers/VideoPlayer.vue'

const fileExplorerStore = useFileExplorerStore()
const workspaceStore = useWorkspaceStore()
const fileContentDisplayModeStore = useFileContentDisplayModeStore()
const { isFullscreenMode, isMinimizedMode } = storeToRefs(fileContentDisplayModeStore)

const contentRef = ref<HTMLElement | null>(null)

const openFiles = computed(() => fileExplorerStore.getOpenFiles)
const activeFile = computed(() => fileExplorerStore.getActiveFile)
const activeFileData = computed(() => fileExplorerStore.getActiveFileData)

const fileContent = ref<string | null>(null) // Local buffer for Monaco editor content
const saveError = ref<string | null>(null)
const isSaving = ref(false)
const showSaveSuccess = ref(false)
let saveSuccessTimeout: ReturnType<typeof setTimeout> | null = null

const getFileName = (filePath: string) => {
  try {
    // This handles full URLs gracefully, extracting the last path segment.
    const url = new URL(filePath);
    const pathname = url.pathname;
    // Decode URI component in case filename has encoded characters like %20 for space
    return decodeURIComponent(pathname.substring(pathname.lastIndexOf('/') + 1)) || filePath;
  } catch (e) {
    // If it's not a valid URL (e.g., a relative workspace path), use the old logic.
    return filePath.split('/').pop() || filePath;
  }
};
const setActiveFile = (filePath: string) => fileExplorerStore.setActiveFile(filePath)
const closeFile = (filePath: string) => fileExplorerStore.closeFile(filePath)
const getFileLanguage = (filePath: string) => getLanguage(filePath)

// Dynamically determine which component to render
const activeViewerComponent = computed(() => {
  const type = activeFileData.value?.type;
  switch (type) {
    case 'Text': return MonacoEditor;
    case 'Image': return ImageViewer;
    case 'Audio': return AudioPlayer;
    case 'Video': return VideoPlayer;
    default: return null;
  }
});

// Compute props for the dynamic component
const viewerProps = computed(() => {
  if (!activeFileData.value) return {};
  switch (activeFileData.value.type) {
    case 'Text':
      return {
        modelValue: fileContent.value,
        language: getFileLanguage(activeFileData.value.path),
      };
    case 'Image':
    case 'Audio':
    case 'Video':
      return {
        url: activeFileData.value.url,
      };
    default:
      return {};
  }
});

// Watch for changes in the active file's data from the store
watch(activeFileData, (newVal) => {
  if (newVal?.type === 'Text') {
    // When a text file is active, sync its content to our local buffer for Monaco
    fileContent.value = newVal.content;
  } else {
    // For non-text files, clear the buffer
    fileContent.value = null;
  }
}, { immediate: true, deep: true });

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  if (saveSuccessTimeout) {
    clearTimeout(saveSuccessTimeout)
  }
})

const handleSave = async () => {
  if (!activeFile.value || fileContent.value === null) return;

  isSaving.value = true
  saveError.value = null
  
  try {
    await saveChanges()
    showSaveSuccess.value = true
    if (saveSuccessTimeout) clearTimeout(saveSuccessTimeout)
    saveSuccessTimeout = setTimeout(() => { showSaveSuccess.value = false }, 2000)
  } catch (error) {
    saveError.value = error instanceof Error ? error.message : 'Failed to save changes'
    setTimeout(() => { saveError.value = null }, 5000)
  } finally {
    isSaving.value = false
  }
}

async function saveChanges() {
  if (!activeFile.value || fileContent.value === null) return
  
  const workspaceId = workspaceStore.activeWorkspace?.workspaceId
  if (!workspaceId) throw new Error('No workspace selected, cannot save file.')
  
  await fileExplorerStore.writeBasicFileContent(
    workspaceId, 
    activeFile.value, 
    fileContent.value
  )
}

const handleKeydown = async (event: KeyboardEvent) => {
  if (isFullscreenMode.value && event.key === 'Escape') {
    fileContentDisplayModeStore.minimize()
  }
}
</script>

<style scoped>
/* Scoped styles remain unchanged */
.close-button {
  font-size: 18px;
}
.close-button:hover {
  background-color: rgba(239, 68, 68, 0.1);
}
.close-button:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.5);
}
button {
  cursor: pointer;
}
</style>
