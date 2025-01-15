<template>
  <div
    id="contentViewer"
    class="bg-white rounded-lg shadow-md flex flex-col h-full"
    ref="contentRef"
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
    <div v-if="!activeFile" class="flex-1 text-center py-4">
      <p class="text-gray-600">No file selected</p>
    </div>

    <!-- If there's an active file, show Monaco editor (always editable) -->
    <div v-else class="flex-1 flex flex-col min-h-0 p-4">
      <div v-if="isContentLoading(activeFile)" class="text-center py-4">
        <p class="text-gray-600">Loading file content...</p>
      </div>
      <div v-else-if="getContentError(activeFile)" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong class="font-bold">Error!</strong>
        <span class="block sm:inline">{{ getContentError(activeFile) }}</span>
      </div>
      <div v-else class="flex-1 bg-gray-50 rounded-lg overflow-hidden relative">
        <MonacoEditor
          v-model="fileContent"
          :language="getFileLanguage(activeFile)"
          @editorDidMount="handleEditorMount"
          class="h-full w-full"
        />
        <div v-if="saveError" class="absolute bottom-2 left-2 text-red-600">
          {{ saveError }}
        </div>
      </div>
    </div>

    <!-- Show minimize controls when in fullscreen mode -->
    <div v-if="isFullscreenMode" class="border-t p-2 flex justify-end items-center gap-2">
      <button
        @click="handleMinimize"
        class="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400 text-sm text-gray-800"
      >
        Minimize Viewer
      </button>
      <small class="text-gray-400">or press <kbd>Esc</kbd></small>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, nextTick, ref, onBeforeMount, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { useFileExplorerStore } from '~/stores/fileExplorer'
import { useFileContentDisplayModeStore } from '~/stores/fileContentDisplayMode'
import { snapshotService } from '~/services/snapshotService'
import { getLanguage } from '~/utils/aiResponseParser/languageDetector'
import MonacoEditor from '~/components/fileExplorer/MonacoEditor.vue'
import { useSaveShortcuts } from '~/composables/useSaveShortcuts'

const fileExplorerStore = useFileExplorerStore()
const fileContentDisplayModeStore = useFileContentDisplayModeStore()
const { isFullscreenMode } = storeToRefs(fileContentDisplayModeStore)

const contentRef = ref<HTMLElement | null>(null)

const openFiles = computed(() => fileExplorerStore.getOpenFiles)
const activeFile = computed(() => fileExplorerStore.getActiveFile)

const fileContent = ref('')
const saveError = ref<string | null>(null)

const getFileName = (filePath: string) => filePath.split('/').pop() || filePath
const setActiveFile = (filePath: string) => fileExplorerStore.setActiveFile(filePath)
const closeFile = (filePath: string) => fileExplorerStore.closeFile(filePath)
const getFileContent = (filePath: string) => fileExplorerStore.getFileContent(filePath)
const isContentLoading = (filePath: string) => fileExplorerStore.isContentLoading(filePath)
const getContentError = (filePath: string) => fileExplorerStore.getContentError(filePath)
const getFileLanguage = (filePath: string) => getLanguage(filePath)

onMounted(() => {
  // Update editor content whenever the active file changes
  watch(activeFile, (newVal) => {
    if (newVal) {
      fileContent.value = getFileContent(newVal) || ''
    }
  }, { immediate: true })

  // Shortcut listener for saving
  useSaveShortcuts(saveChanges)

  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})

onBeforeMount(() => {
  // Ensure no leftover listeners from prior usage
  window.removeEventListener('keydown', handleKeydown)
})

const handleEditorMount = (editor: any) => {
  editor.focus()
}

// Method to save changes via the store
async function saveChanges() {
  if (!activeFile.value) return
  try {
    await fileExplorerStore.applyFileChange(
      fileExplorerStore.workspaceId, 
      activeFile.value, 
      fileContent.value,
      'conversationId_example', // Replace with actual conversation ID if needed
      0 // Replace with actual message index if needed
    )
    saveError.value = null
  } catch (error: any) {
    saveError.value = error.message || 'Failed to save changes'
  }
}

const handleMinimize = async () => {
  console.log('Minimize triggered')
  if (!contentRef.value) {
    console.error('No content element to capture')
    return
  }

  try {
    // Capture the snapshot while component is visible
    console.log('Capturing snapshot before state change')
    await snapshotService.captureSnapshot(contentRef.value)
    console.log('Snapshot captured, starting minimize')
    fileContentDisplayModeStore.startMinimize()
    await fileContentDisplayModeStore.finishMinimize()
  } catch (error) {
    console.error('Failed to handle minimize:', error)
    fileContentDisplayModeStore.finishMinimize()
  }
}

// Handle pressing Esc to minimize in fullscreen mode
const handleKeydown = async (event: KeyboardEvent) => {
  if (isFullscreenMode.value && event.key === 'Escape') {
    await handleMinimize()
  }
}
</script>

<style scoped>
pre {
  margin: 0;
  padding: 0;
  background-color: transparent;
  overflow: visible;
}

code {
  font-family: 'Fira Code', monospace;
  font-size: 14px;
  line-height: 1.5;
  display: block;
  white-space: pre-wrap;
}

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
