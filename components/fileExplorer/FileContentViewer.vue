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
      <div v-else-if="fileContent !== null" class="flex-1 bg-gray-50 rounded-lg overflow-hidden relative">
        <MonacoEditor
          v-model="fileContent"
          :language="getFileLanguage(activeFile)"
          @editorDidMount="handleEditorMount"
          @save="handleSave"
          class="h-full w-full"
        />
        <div 
          v-if="saveError" 
          class="absolute bottom-2 left-2 text-red-600 bg-white px-2 py-1 rounded shadow"
        >
          {{ saveError }}
        </div>
        <div 
          v-if="isSaving" 
          class="absolute bottom-2 right-2 text-gray-600 bg-white px-2 py-1 rounded shadow"
        >
          Saving...
        </div>
        <div 
          v-if="showSaveSuccess" 
          class="absolute bottom-2 right-2 text-green-600 bg-white px-2 py-1 rounded shadow"
        >
          Changes saved
        </div>
      </div>
    </div>

    <!-- Show minimize hint when in fullscreen mode -->
    <div v-if="isFullscreenMode" class="border-t p-2 flex justify-end items-center">
      <small class="text-gray-700 font-medium">Press <kbd class="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded">Esc</kbd> to exit fullscreen</small>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, ref, onBeforeMount, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { useFileExplorerStore } from '~/stores/fileExplorer'
import { useFileContentDisplayModeStore } from '~/stores/fileContentDisplayMode'
import { snapshotService } from '~/services/snapshotService'
import { getLanguage } from '~/utils/aiResponseParser/languageDetector'
import MonacoEditor from '~/components/fileExplorer/MonacoEditor.vue'

const fileExplorerStore = useFileExplorerStore()
const fileContentDisplayModeStore = useFileContentDisplayModeStore()
const { isFullscreenMode } = storeToRefs(fileContentDisplayModeStore)

const contentRef = ref<HTMLElement | null>(null)

const openFiles = computed(() => fileExplorerStore.getOpenFiles)
const activeFile = computed(() => fileExplorerStore.getActiveFile)

const fileContent = ref<string | null>(null)
const saveError = ref<string | null>(null)
const isSaving = ref(false)
const showSaveSuccess = ref(false)
let saveSuccessTimeout: ReturnType<typeof setTimeout> | null = null

const getFileName = (filePath: string) => filePath.split('/').pop() || filePath
const setActiveFile = (filePath: string) => fileExplorerStore.setActiveFile(filePath)
const closeFile = (filePath: string) => fileExplorerStore.closeFile(filePath)
const getFileContent = (filePath: string) => fileExplorerStore.getFileContent(filePath)
const isContentLoading = (filePath: string) => fileExplorerStore.isContentLoading(filePath)
const getContentError = (filePath: string) => fileExplorerStore.getContentError(filePath)
const getFileLanguage = (filePath: string) => getLanguage(filePath)

watch(activeFile, (newVal) => {
  if (newVal) {
    fileContent.value = null // Reset to null while loading
    const content = getFileContent(newVal)
    if (content !== null) {
      fileContent.value = content
    }
  } else {
    fileContent.value = null
  }
}, { immediate: true })

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  if (saveSuccessTimeout) {
    clearTimeout(saveSuccessTimeout)
  }
})

onBeforeMount(() => {
  window.removeEventListener('keydown', handleKeydown)
})

const handleEditorMount = (editor: any) => {
  editor.focus()
}

const handleSave = async () => {
  console.log('Save handler triggered in FileContentViewer')
  
  if (!activeFile.value || fileContent.value === null) {
    console.error('Cannot save: No active file or content')
    return
  }

  isSaving.value = true
  saveError.value = null
  
  try {
    console.log('Attempting to save file:', activeFile.value)
    await saveChanges()
    
    console.log('Save successful')
    showSaveSuccess.value = true
    if (saveSuccessTimeout) {
      clearTimeout(saveSuccessTimeout)
    }
    saveSuccessTimeout = setTimeout(() => {
      showSaveSuccess.value = false
    }, 2000)
  } catch (error) {
    console.error('Save failed:', error)
    saveError.value = error instanceof Error ? error.message : 'Failed to save changes'
    setTimeout(() => {
      saveError.value = null
    }, 5000)
  } finally {
    isSaving.value = false
  }
}

async function saveChanges() {
  if (!activeFile.value || fileContent.value === null) return
  
  console.log('Saving changes for file:', activeFile.value)
  
  await fileExplorerStore.writeBasicFileContent(
    fileExplorerStore.workspaceId, 
    activeFile.value, 
    fileContent.value
  )
}

const handleMinimize = async () => {
  if (!contentRef.value) {
    console.error('No content element to capture')
    return
  }

  try {
    await snapshotService.captureSnapshot(contentRef.value)
    fileContentDisplayModeStore.startMinimize()
    await fileContentDisplayModeStore.finishMinimize()
  } catch (error) {
    console.error('Failed to handle minimize:', error)
    fileContentDisplayModeStore.finishMinimize()
  }
}

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

.save-indicator {
  transition: opacity 0.3s ease-in-out;
}
</style>
