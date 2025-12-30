<template>
  <!-- Zen: teleport to body so it sits above the sidebar stacking context -->
  <Teleport v-if="isZenMode" to="body">
    <div
      id="contentViewer"
      class="bg-white rounded-lg shadow-md flex flex-col h-full fixed inset-0 z-[120] min-h-screen"
      ref="contentRef"
    >
      <div class="flex-1 flex flex-col min-h-0">
        <!-- If no file is active -->
        <div v-if="!activeFile" class="flex-1 text-center py-4 flex items-center justify-center">
          <p class="text-gray-600">No file selected</p>
        </div>

        <!-- Main content -->
        <div v-else class="flex-1 flex flex-col min-h-0">
          <div v-if="activeFileData?.isLoading" class="flex-1 text-center py-4 flex items-center justify-center">
            <p class="text-gray-600">Loading file content...</p>
          </div>
          <div v-else-if="activeFileData?.error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative m-4" role="alert">
            <strong class="font-bold">Error!</strong>
            <span class="block sm:inline">{{ activeFileData.error }}</span>
          </div>
          <div v-else-if="activeFileData && activeViewerComponent" class="flex-1 bg-gray-50 rounded-lg overflow-hidden relative min-h-0">
            <component
              :is="activeViewerComponent"
              v-bind="viewerProps"
              @update:model-value="fileContent = $event"
              @save="handleSave"
              class="h-full w-full flex-1 min-h-0 overflow-auto"
            />
            <template v-if="activeFileData.type === 'Text' && activeFile && activeFileMode === 'edit'">
              <div v-if="saveContentError" class="absolute bottom-2 left-2 text-red-600 bg-white px-2 py-1 rounded shadow">
                {{ saveContentError }}
              </div>
              <div v-if="isSavingContent" class="absolute bottom-2 right-2 text-gray-600 bg-white px-2 py-1 rounded shadow">
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
      </div>

      <button
        class="absolute top-3 right-3 p-2 rounded-full border border-gray-200 bg-white shadow hover:bg-gray-100"
        @click.stop="toggleZenMode"
        title="Exit full view"
      >
        <XMarkIcon class="h-5 w-5 text-gray-700" />
      </button>
    </div>
  </Teleport>

  <!-- Normal render -->
  <div
    v-else
    id="contentViewer"
    class="bg-white rounded-lg shadow-md flex flex-col h-full"
    ref="contentRef"
  >
    <!-- File Tabs & Controls Header -->
    <div class="flex items-center border-b border-gray-200 bg-white overflow-x-auto sticky top-0 z-10 px-0 h-[46px]">
      <div class="flex flex-1 px-2 gap-4 items-center min-w-0">
         <div class="flex gap-4 overflow-x-auto no-scrollbar mask-fade-right">
            <button 
            v-for="file in openFiles" 
            :key="file"
            @click="setActiveFile(file)"
            @contextmenu.prevent="showContextMenu($event, file)"
            tabindex="0"
            @keyup.enter="setActiveFile(file)"
            class="group relative flex items-center gap-2 px-1 py-2.5 text-sm font-medium border-b-2 transition-all duration-150 focus:outline-none whitespace-nowrap"
            :class="file === activeFile 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
            >
            <span class="truncate max-w-[150px]">{{ getFileName(file) }}</span>
            <span 
                v-if="file === activeFile"
                @click.stop="closeFile(file)" 
                class="flex items-center justify-center w-4 h-4 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600 transition-all ml-1"
                aria-label="Close file"
            >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </span>
            </button>
        </div>
      </div>
      
      <!-- Right Side Controls -->
      <div class="flex items-center gap-1 pr-2 shrink-0">
        <!-- Edit/Preview Group -->
        <div v-if="activeFileData?.type === 'Text' && isPreviewableText" class="flex items-center gap-1">
           <button
            class="p-1.5 rounded-md transition-all duration-200 focus:outline-none"
            :class="activeFileMode === 'edit' 
              ? 'bg-blue-50 text-blue-600' 
              : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'"
            @click.stop="setMode('edit')"
             title="Edit Mode"
          >
            <PencilSquareIcon class="h-4 w-4" />
          </button>
          <button
            class="p-1.5 rounded-md transition-all duration-200 focus:outline-none"
            :class="activeFileMode === 'preview' 
              ? 'bg-blue-50 text-blue-600' 
              : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'"
            @click.stop="setMode('preview')"
             title="Preview Mode"
          >
            <EyeIcon class="h-4 w-4" />
          </button>
          
          <!-- Divider -->
          <div class="h-4 w-px bg-gray-200 mx-1"></div>
        </div>

        <!-- Close All button -->
        <button 
            v-if="openFiles.length > 1"
            @click="closeAllFiles"
            class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
            title="Close all files"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
        </button>

         <!-- Zen Mode -->
         <button
          class="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all duration-200 focus:outline-none"
          @click.stop="toggleZenMode"
          :title="isZenMode ? 'Restore view' : 'Maximize view'"
        >
          <ArrowsPointingOutIcon v-if="!isZenMode" class="h-4 w-4" />
          <ArrowsPointingInIcon v-else class="h-4 w-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, ref, onBeforeUnmount } from 'vue'
import { Teleport } from 'vue'
import { storeToRefs } from 'pinia'
import { useFileExplorerStore } from '~/stores/fileExplorer'
import { useWorkspaceStore } from '~/stores/workspace'
import { useFileContentDisplayModeStore } from '~/stores/fileContentDisplayMode'
import { getLanguage } from '~/utils/aiResponseParser/languageDetector'
import { ArrowsPointingOutIcon, ArrowsPointingInIcon, XMarkIcon, PencilSquareIcon, EyeIcon } from '@heroicons/vue/24/outline'

// Viewer components
import MonacoEditor from '~/components/fileExplorer/MonacoEditor.vue'
import ImageViewer from '~/components/fileExplorer/viewers/ImageViewer.vue'
import AudioPlayer from '~/components/fileExplorer/viewers/AudioPlayer.vue'
import VideoPlayer from '~/components/fileExplorer/viewers/VideoPlayer.vue'
import MarkdownPreviewer from '~/components/fileExplorer/viewers/MarkdownPreviewer.vue'
import HtmlPreviewer from '~/components/fileExplorer/viewers/HtmlPreviewer.vue'
import ExcelViewer from '~/components/fileExplorer/viewers/ExcelViewer.vue'

const fileExplorerStore = useFileExplorerStore()
const workspaceStore = useWorkspaceStore()
const fileContentDisplayModeStore = useFileContentDisplayModeStore()
const { isZenMode } = storeToRefs(fileContentDisplayModeStore)

const contentRef = ref<HTMLElement | null>(null)

const openFiles = computed(() => fileExplorerStore.getOpenFiles)
const activeFile = computed(() => fileExplorerStore.getActiveFile)
const activeFileData = computed(() => fileExplorerStore.getActiveFileData)

const fileContent = ref<string | null>(null)
const showSaveSuccess = ref(false)
let saveSuccessTimeout: ReturnType<typeof setTimeout> | null = null

const isSavingContent = computed(() => activeFile.value ? fileExplorerStore.isSaveContentLoading(activeFile.value) : false)
const saveContentError = computed(() => activeFile.value ? fileExplorerStore.getSaveContentError(activeFile.value) : null)

const getFileName = (filePath: string) => {
  try {
    const url = new URL(filePath);
    const pathname = url.pathname;
    return decodeURIComponent(pathname.substring(pathname.lastIndexOf('/') + 1)) || filePath;
  } catch (e) {
    return filePath.split('/').pop() || filePath;
  }
};
const setActiveFile = (filePath: string) => fileExplorerStore.setActiveFile(filePath)
const closeFile = (filePath: string) => fileExplorerStore.closeFile(filePath)
const closeAllFiles = () => fileExplorerStore.closeAllFiles()
const closeOtherFiles = (filePath: string) => fileExplorerStore.closeOtherFiles(filePath)
const getFileLanguage = (filePath: string) => getLanguage(filePath)
const setMode = (mode: 'edit' | 'preview') => {
  if (!activeFile.value) return
  fileExplorerStore.setFileMode(activeFile.value, mode)
}

const isPreviewableText = computed(() => {
  const path = activeFileData.value?.path?.toLowerCase?.() || ''
  return path.endsWith('.md') || path.endsWith('.markdown') || path.endsWith('.html') || path.endsWith('.htm')
})

const activeFileMode = computed(() => activeFileData.value?.mode ?? 'edit')
const toggleZenMode = () => fileContentDisplayModeStore.toggleZenMode()

// Context menu state
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  targetFile: null as string | null
})

const showContextMenu = (event: MouseEvent, file: string) => {
  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    targetFile: file
  }
}

const hideContextMenu = () => {
  contextMenu.value.visible = false
  contextMenu.value.targetFile = null
}

const handleContextClose = () => {
  if (contextMenu.value.targetFile) {
    closeFile(contextMenu.value.targetFile)
  }
  hideContextMenu()
}

const handleContextCloseOthers = () => {
  if (contextMenu.value.targetFile) {
    closeOtherFiles(contextMenu.value.targetFile)
  }
  hideContextMenu()
}

const handleContextCloseAll = () => {
  closeAllFiles()
  hideContextMenu()
}

// Check if Monaco editor is focused
const isEditorFocused = () => {
  const activeEl = document.activeElement
  if (!activeEl) return false
  // Monaco editor uses textarea or elements with monaco-editor class
  return activeEl.tagName === 'TEXTAREA' || 
         activeEl.closest('.monaco-editor') !== null
}

const activeViewerComponent = computed(() => {
  const file = activeFileData.value
  if (!file) return null

  const lowerPath = (file.path || '').toLowerCase()

  if (file.type === 'Text') {
    if (activeFileMode.value === 'preview') {
      if (lowerPath.endsWith('.md') || lowerPath.endsWith('.markdown')) return MarkdownPreviewer
      if (lowerPath.endsWith('.html') || lowerPath.endsWith('.htm')) return HtmlPreviewer
      return MarkdownPreviewer
    }
    return MonacoEditor
  }

  switch (file.type) {
    case 'Image': return ImageViewer
    case 'Audio': return AudioPlayer
    case 'Video': return VideoPlayer
    case 'Excel': return ExcelViewer
    default: return null
  }
});

const viewerProps = computed(() => {
  const file = activeFileData.value
  if (!file) return {}

  if (file.type === 'Text') {
    if (activeFileMode.value === 'preview') {
      return {
        content: file.content ?? fileContent.value ?? '',
        path: file.path,
      }
    }
    return {
      modelValue: fileContent.value,
      language: getFileLanguage(file.path),
    }
  }

  if (['Image', 'Audio', 'Video', 'Excel'].includes(file.type)) {
    return { url: file.url }
  }

  return {}
});

watch(activeFileData, (newVal) => {
  if (newVal?.type === 'Text') {
    fileContent.value = newVal.content;
  } else {
    fileContent.value = null;
  }
}, { immediate: true, deep: true });

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  document.addEventListener('click', hideContextMenu)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('click', hideContextMenu)
  if (saveSuccessTimeout) {
    clearTimeout(saveSuccessTimeout)
  }
})

const handleSave = async () => {
  if (!activeFile.value || fileContent.value === null || isSavingContent.value) return;

  try {
    const workspaceId = workspaceStore.activeWorkspace?.workspaceId
    if (!workspaceId) throw new Error('No workspace selected, cannot save file.')

    await fileExplorerStore.saveFileContentFromEditor(
      workspaceId, 
      activeFile.value, 
      fileContent.value
    )
    
    showSaveSuccess.value = true
    if (saveSuccessTimeout) clearTimeout(saveSuccessTimeout)
    saveSuccessTimeout = setTimeout(() => { showSaveSuccess.value = false }, 2000)
  } catch (error) {
    console.error("Save operation failed:", error)
  }
}

const handleKeydown = async (event: KeyboardEvent) => {
  // Exit Zen mode on Escape
  if (event.key === 'Escape' && isZenMode.value) {
    fileContentDisplayModeStore.exitZenMode()
    return
  }
  
  // Arrow key navigation - only when editor is NOT focused
  if (!isEditorFocused() && openFiles.value.length > 1) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      fileExplorerStore.navigateToPreviousTab()
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      fileExplorerStore.navigateToNextTab()
    }
  }
}
</script>

<style scoped>
.close-button {
  font-size: 18px;
}
.close-button:hover {
  background-color: rgba(239, 68, 68, 0.1);
}
</style>
