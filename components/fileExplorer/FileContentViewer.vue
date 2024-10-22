<template>
  <div id="contentViewer" class="h-full flex flex-col bg-white">
    <div class="flex h-10 min-h-[40px] overflow-x-auto whitespace-nowrap border-b scrollbar-hide">
      <button 
        v-for="file in openFiles" 
        :key="file"
        @click="setActiveFile(file)"
        :class="['px-4 h-full text-sm font-medium border-r focus:outline-none inline-flex items-center transition-colors', 
                 file === activeFile ? 'bg-gray-100 text-gray-800' : 'text-gray-600 hover:bg-gray-50']"
      >
        <span class="truncate max-w-[200px]">{{ getFileName(file) }}</span>
        <span 
          @click.stop="closeFile(file)" 
          class="ml-2 px-1 text-gray-400 hover:text-gray-700 rounded-sm hover:bg-gray-200"
        >&times;</span>
      </button>
    </div>
    <div class="flex-grow overflow-auto p-4">
      <div v-if="activeFile">
        <div v-if="isContentLoading(activeFile)" class="text-center py-4">
          <p class="text-gray-600">Loading file content...</p>
        </div>
        <div v-else-if="getContentError(activeFile)" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong class="font-bold">Error!</strong>
          <span class="block sm:inline">{{ getContentError(activeFile) }}</span>
        </div>
        <div v-else>
          <div v-if="hasPendingChange(activeFile)" class="mb-4">
            <h3 class="text-md font-semibold text-blue-700 mb-2">Pending Changes</h3>
            <pre class="bg-yellow-100 p-4 rounded-lg overflow-auto">
 <code class="language-diff" v-html="diffContent"></code>
            </pre>
            <div class="flex space-x-2 mt-2">
              <button 
                @click="confirmChange"
                class="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-4 rounded"
              >
                Confirm
              </button>
              <button 
                @click="cancelChange"
                class="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-4 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
          <div v-if="hasPendingChange(activeFile)">
            <h3 class="text-md font-semibold mb-2 text-gray-700">Original Content</h3>
            <div class="bg-gray-50 p-4 rounded-lg text-gray-600 mb-4">
              <pre><code :class="'language-' + getFileLanguage(activeFile)" v-html="highlightedOriginalContent"></code></pre>
            </div>
            <h3 class="text-md font-semibold mb-2 text-gray-700">New Content</h3>
            <div class="bg-gray-50 p-4 rounded-lg text-gray-600">
              <pre><code :class="'language-' + getFileLanguage(activeFile)" v-html="highlightedNewContent"></code></pre>
            </div>
          </div>
          <div v-else-if="getFileContent(activeFile)" class="bg-gray-50 p-4 rounded-lg text-gray-600">
            <pre><code :class="'language-' + getFileLanguage(activeFile)" v-html="highlightedContent"></code></pre>
          </div>
        </div>
      </div>
      <div v-else class="h-full flex items-center justify-center">
        <p class="text-gray-600">No file selected</p>
      </div>
    </div>
  </div>
 </template>

<script setup lang="ts">
import { computed, watch, onMounted, nextTick } from 'vue';
import { useFileExplorerStore } from '~/stores/fileExplorer';
import { useWorkspaceStore } from '~/stores/workspace';
import Prism from 'prismjs';
import 'prismjs/themes/prism.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-markup-templating';
import 'prismjs/components/prism-php';
import { getLanguage } from '~/utils/codeBlockParser/languageDetector';
import { highlightVueCode } from '~/utils/codeBlockParser/vueCodeHighlight';
import { diffLines } from 'diff';

const fileExplorerStore = useFileExplorerStore();
const workspaceStore = useWorkspaceStore();

const openFiles = computed(() => fileExplorerStore.openFiles);
const activeFile = computed(() => fileExplorerStore.activeFile);

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

const highlightedOriginalContent = computed(() => {
  if (!activeFile.value) return '';
  const originalContent = getFileContent(activeFile.value);
  if (!originalContent) return '';
  const language = getFileLanguage(activeFile.value);
  
  if (language === 'vue') {
    return highlightVueCode(originalContent);
  } else {
    return Prism.highlight(originalContent, Prism.languages[language] || Prism.languages.plaintext, language);
  }
});

const highlightedNewContent = computed(() => {
  if (!activeFile.value) return '';
  const newContent = fileExplorerStore.getPendingChange(activeFile.value);
  if (!newContent) return '';
  const language = getFileLanguage(activeFile.value);
  
  if (language === 'vue') {
    return highlightVueCode(newContent);
  } else {
    return Prism.highlight(newContent, Prism.languages[language] || Prism.languages.plaintext, language);
  }
});

const hasPendingChange = (filePath: string) => {
  return !!fileExplorerStore.getPendingChange(filePath);
}

const diffContent = computed(() => {
  if (!activeFile.value) return '';
  const original = getFileContent(activeFile.value) || '';
  const changed = fileExplorerStore.getPendingChange(activeFile.value) || '';
  const diff = diffLines(original, changed);
  let result = '';
  diff.forEach(part => {
    const color = part.added ? 'green' :
                  part.removed ? 'red' : 'grey';
    const prefix = part.added ? '+' :
                   part.removed ? '-' : ' ';
    const escaped = part.value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    if (part.added) {
      result += `<span style="color: green;">+${escaped}</span>`;
    } else if (part.removed) {
      result += `<span style="color: red;">-${escaped}</span>`;
    } else {
      result += `<span style="color: grey;"> ${escaped}</span>`;
    }
  });
  return result;
});

const confirmChange = async () => {
  if (!activeFile.value) return;
  const newContent = fileExplorerStore.getPendingChange(activeFile.value);
  if (!newContent) return;

  try {
    await fileExplorerStore.applyFileChange(activeFile.value, newContent);
  } catch (error) {
    // Handle error if needed
  }
}

const cancelChange = () => {
  if (!activeFile.value) return;
  fileExplorerStore.clearPendingChange(activeFile.value);
}

onMounted(() => {
  Prism.highlightAll();
});

watch(activeFile, () => {
  nextTick(() => {
    Prism.highlightAll();
  });
});
</script>

<style>
/* Only keeping styles that aren't possible with Tailwind */
.scrollbar-hide {
 -ms-overflow-style: none;  /* IE and Edge */
 scrollbar-width: none;  /* Firefox */
}
.scrollbar-hide::-webkit-scrollbar {
 display: none;  /* Chrome, Safari and Opera */
}

pre {
 margin: 0;
 padding: 0;
 background-color: transparent;
}

code {
 font-family: 'Fira Code', monospace;
 font-size: 14px;
 line-height: 1.5;
}
</style>