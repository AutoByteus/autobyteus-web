
<template>
  <div id="contentViewer" class="bg-white rounded-lg shadow-md flex flex-col h-full">
    <div class="flex border-b overflow-x-auto sticky top-0 bg-white z-10 p-2">
      <div 
        v-for="file in openFiles" 
        :key="file"
        @click="setActiveFile(file)"
        role="button"
        tabindex="0"
        @keyup.enter="setActiveFile(file)"
        :class="['px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center gap-2', 
                 file === activeFile ? 'bg-gray-200 text-gray-800' : 'text-gray-600 hover:bg-gray-100']"
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
      <div v-if="activeFile" class="flex flex-col h-full">
        <div v-if="isContentLoading(activeFile)" class="text-center py-4">
          <p class="text-gray-600">Loading file content...</p>
        </div>
        <div v-else-if="getContentError(activeFile)" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong class="font-bold">Error!</strong>
          <span class="block sm:inline">{{ getContentError(activeFile) }}</span>
        </div>
        <div v-else-if="!isEditing" class="flex flex-col h-full p-4">
          <div class="flex-1 bg-gray-50 p-4 rounded-lg text-gray-600 relative">
            <pre class="overflow-visible h-full"><code :class="'language-' + getFileLanguage(activeFile)" v-html="highlightedContent"></code></pre>
            <div class="absolute bottom-4 left-4">
              <button 
                @click="enterEditMode" 
                class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Edit
              </button>
            </div>
          </div>
        </div>
        <div v-else class="flex flex-col h-full p-4">
          <div class="flex-1 bg-gray-50 rounded-lg overflow-hidden">
            <MonacoEditor
              v-model="editedContent"
              :language="getFileLanguage(activeFile)"
              @editorDidMount="handleEditorMount"
              class="h-full w-full"
            />
          </div>
          <div class="mt-4 flex space-x-2">
            <button 
              @click="saveChanges" 
              class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Save
            </button>
            <button 
              @click="cancelEdit" 
              class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
          </div>
          <div v-if="saveError" class="mt-2 text-red-600">
            {{ saveError }}
          </div>
        </div>
      </div>
      <div v-else class="text-center py-4">
        <p class="text-gray-600">No file selected</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, nextTick, ref } from 'vue';
import { useFileExplorerStore } from '~/stores/fileExplorer';
import Prism from 'prismjs';
import 'prismjs/themes/prism.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-markup-templating';
import 'prismjs/components/prism-php';
import { getLanguage } from '~/utils/aiResponseParser/languageDetector';
import { highlightVueCode } from '~/utils/aiResponseParser/vueCodeHighlight';
import MonacoEditor from '~/components/fileExplorer/MonacoEditor.vue';

const fileExplorerStore = useFileExplorerStore();

const openFiles = computed(() => fileExplorerStore.getOpenFiles);
const activeFile = computed(() => fileExplorerStore.getActiveFile);

const getFileName = (filePath: string) => filePath.split('/').pop() || filePath;

const setActiveFile = (filePath: string) => fileExplorerStore.setActiveFile(filePath);
const closeFile = (filePath: string) => fileExplorerStore.closeFile(filePath);

const getFileContent = (filePath: string) => fileExplorerStore.getFileContent(filePath);
const isContentLoading = (filePath: string) => fileExplorerStore.isContentLoading(filePath);
const getContentError = (filePath: string) => fileExplorerStore.getContentError(filePath);

const getFileLanguage = (filePath: string) => getLanguage(filePath);

const highlightedContent = computed(() => {
  if (!activeFile.value) return '';
  const content = getFileContent(activeFile.value);
  if (!content) return '';
  const language = getFileLanguage(activeFile.value);
  
  if (language === 'vue') {
    return highlightVueCode(content);
  } else {
    return Prism.highlight(content, Prism.languages[language] || Prism.languages.plaintext, language);
  }
});

// Edit mode state
const isEditing = ref(false);
const editedContent = ref('');
const saveError = ref<string | null>(null);

const handleEditorMount = (editor: any) => {
  editor.focus();
};

// Enter edit mode
const enterEditMode = () => {
  if (activeFile.value) {
    editedContent.value = getFileContent(activeFile.value) || '';
    isEditing.value = true;
  }
};

// Cancel edit
const cancelEdit = () => {
  isEditing.value = false;
  saveError.value = null;
};

// Save changes
const saveChanges = async () => {
  if (!activeFile.value) return;
  try {
    await fileExplorerStore.applyFileChange(
      fileExplorerStore.workspaceId, 
      activeFile.value, 
      editedContent.value,
      'conversationId_example', // Replace with actual conversation ID
      0 // Replace with actual message index
    );
    isEditing.value = false;
    saveError.value = null;
  } catch (error: any) {
    saveError.value = error.message || 'Failed to save changes';
  }
};

onMounted(() => {
  Prism.highlightAll();
});

watch(activeFile, () => {
  nextTick(() => {
    Prism.highlightAll();
  });
});
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
