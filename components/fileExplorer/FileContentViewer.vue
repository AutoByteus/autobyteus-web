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
    v-if="isFullscreenMode || (!isFullscreenMode && !isMinimizedMode)"
  >
    <!-- Tabs -->
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

    <div class="flex-1 flex flex-col min-h-0">
      <div v-if="!activeFile" class="flex-1 text-center py-4 flex items-center justify-center">
        <p class="text-gray-600">No file selected</p>
      </div>

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

    <div class="border-top-footer border-t p-2 flex items-center gap-3 text-sm text-gray-700">
      <div class="flex-1"></div>

      <div class="flex items-center gap-2">
        <button
          class="p-2 rounded border border-gray-300 bg-white shadow-sm hover:bg-gray-100"
          @click.stop="toggleZenMode"
          :title="isZenMode ? 'Restore' : 'Maximize'"
        >
          <ArrowsPointingOutIcon v-if="!isZenMode" class="h-5 w-5 text-gray-700" />
          <ArrowsPointingInIcon v-else class="h-5 w-5 text-gray-700" />
        </button>

        <template v-if="activeFileData?.type === 'Text' && isPreviewableText">
          <button
            class="px-3 py-1 rounded border border-gray-300 bg-white shadow-sm hover:bg-gray-100"
            :class="{ 'bg-blue-100 border-blue-300 text-blue-800': activeFileMode === 'edit' }"
            @click.stop="setMode('edit')"
          >Edit</button>
          <button
            class="px-3 py-1 rounded border border-gray-300 bg-white shadow-sm hover:bg-gray-100"
            :class="{ 'bg-blue-100 border-blue-300 text-blue-800': activeFileMode === 'preview' }"
            @click.stop="() => { setMode('preview'); enterZen(); }"
          >Preview</button>
        </template>
      </div>

      <small v-if="isFullscreenMode" class="font-medium whitespace-nowrap">
        Press <kbd class="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded">Esc</kbd> to minimize
      </small>
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
import { ArrowsPointingOutIcon, ArrowsPointingInIcon, XMarkIcon } from '@heroicons/vue/24/outline'

// Viewer components
import MonacoEditor from '~/components/fileExplorer/MonacoEditor.vue'
import ImageViewer from '~/components/fileExplorer/viewers/ImageViewer.vue'
import AudioPlayer from '~/components/fileExplorer/viewers/AudioPlayer.vue'
import VideoPlayer from '~/components/fileExplorer/viewers/VideoPlayer.vue'
import MarkdownPreviewer from '~/components/fileExplorer/viewers/MarkdownPreviewer.vue'
import HtmlPreviewer from '~/components/fileExplorer/viewers/HtmlPreviewer.vue'

const fileExplorerStore = useFileExplorerStore()
const workspaceStore = useWorkspaceStore()
const fileContentDisplayModeStore = useFileContentDisplayModeStore()
const { isFullscreenMode, isMinimizedMode, isZenMode } = storeToRefs(fileContentDisplayModeStore)

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
const enterZen = () => {
  if (!isZenMode.value) fileContentDisplayModeStore.toggleZenMode()
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

  if (['Image', 'Audio', 'Video'].includes(file.type)) {
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
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
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
  if (event.key === 'Escape') {
    if (isZenMode.value) {
      fileContentDisplayModeStore.toggleZenMode()
      return
    }
  }
  if (isFullscreenMode.value && event.key === 'Escape') {
    fileContentDisplayModeStore.minimize()
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
