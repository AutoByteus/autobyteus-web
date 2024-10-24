<!-- File: autobyteus-web/components/conversation/AIMessage.vue -->
<!-- This component renders an AI message -->
<template>
  <div>
    <strong>AI:</strong>
    <div>
      <template v-for="(segment, segmentIndex) in parseAIResponse(message.text).segments" :key="segmentIndex">
        <div v-if="segment.type === 'text'" v-html="formatText(segment.content)" class="mb-4 break-words"></div>
        <div v-else-if="segment.type === 'file_content'">
          <div class="overflow-x-auto">
            <div v-for="file in segment.fileGroup.files" :key="file.path" class="mb-4">
              <div class="flex justify-between items-center bg-gray-200 p-2 rounded-t-md">
                <span class="font-bold">File: {{ file.path }}</span>
                <button
                  @click="handleApplyFileChange(conversationId, messageIndex, file.path, file.originalContent)"
                  :disabled="isApplyChangeDisabled(conversationId, messageIndex, file.path)"
                  :class="[
                    'font-bold py-1 px-2 rounded transition-colors duration-200 text-sm',
                    isApplyChangeDisabled(conversationId, messageIndex, file.path)
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-700 text-white'
                  ]"
                >
                  <span v-if="isApplyChangeInProgress(conversationId, messageIndex, file.path)">
                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Applying...
                  </span>
                  <span v-else-if="isApplied(conversationId, messageIndex, file.path)">
                    Applied
                  </span>
                  <span v-else>
                    Apply
                  </span>
                </button>
              </div>
              <pre :class="'language-' + file.language + ' w-full overflow-x-auto'"><code v-html="file.highlightedContent"></code></pre>
              <div v-if="fileExplorerStore.getApplyChangeError(conversationId, messageIndex, file.path)" class="mt-2 p-2 rounded bg-red-100 text-red-800">
                {{ fileExplorerStore.getApplyChangeError(conversationId, messageIndex, file.path) }}
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUpdated, ref } from 'vue';
import type { AIMessage } from '~/types/conversation';
import Prism from 'prismjs';
import 'prismjs/themes/prism.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-markup-templating';
import 'prismjs/components/prism-php';
import { parseAIResponse } from '~/utils/codeBlockParser/codeBlockHighlight';
import { useFileExplorerStore } from '~/stores/fileExplorer';
import { useWorkspaceStore } from '~/stores/workspace';

const props = defineProps<{
  message: AIMessage;
  conversationId: string;
  messageIndex: number;
}>();

const fileExplorerStore = useFileExplorerStore();
const workspaceStore = useWorkspaceStore();

const applyResults = ref<Record<string, Record<number, Record<string, { success: boolean; message: string }>>>>({});

const isApplyChangeDisabled = (conversationId: string, messageIndex: number, filePath: string) => {
  return (
    fileExplorerStore.isApplyChangeInProgress(conversationId, messageIndex, filePath) ||
    (applyResults.value[conversationId] &&
      applyResults.value[conversationId][messageIndex] &&
      applyResults.value[conversationId][messageIndex][filePath]?.success)
  );
};

const isApplyChangeInProgress = (conversationId: string, messageIndex: number, filePath: string) => {
  return fileExplorerStore.isApplyChangeInProgress(conversationId, messageIndex, filePath);
};

const isApplied = (conversationId: string, messageIndex: number, filePath: string) => {
  return applyResults.value[conversationId]?.[messageIndex]?.[filePath]?.success;
};

const handleApplyFileChange = async (
  conversationId: string,
  messageIndex: number,
  filePath: string,
  originalContent: string
) => {
  if (!applyResults.value[conversationId]) {
    applyResults.value[conversationId] = {};
  }
  if (!applyResults.value[conversationId][messageIndex]) {
    applyResults.value[conversationId][messageIndex] = {};
  }

  try {
    await fileExplorerStore.applyFileChange(
      workspaceStore.currentSelectedWorkspaceId,
      filePath,
      originalContent,
      conversationId,
      messageIndex
    );
    applyResults.value[conversationId][messageIndex][filePath] = { success: true, message: 'Changes applied successfully!' };
  } catch (error) {
    console.error('Failed to apply file change:', error);
    applyResults.value[conversationId][messageIndex][filePath] = { success: false, message: 'Failed to apply changes. Please try again.' };
    setTimeout(() => {
      if (
        applyResults.value[conversationId] &&
        applyResults.value[conversationId][messageIndex]
      ) {
        delete applyResults.value[conversationId][messageIndex][filePath];
        if (Object.keys(applyResults.value[conversationId][messageIndex]).length === 0) {
          delete applyResults.value[conversationId][messageIndex];
        }
        if (Object.keys(applyResults.value[conversationId]).length === 0) {
          delete applyResults.value[conversationId];
        }
      }
      fileExplorerStore.setApplyChangeError(conversationId, messageIndex, filePath, null);
    }, 5000);
  }
};

const formatText = (text: string) => {
  return text.replace(/\n/g, '<br>');
};

onMounted(() => {
  try {
    Prism.highlightAll();
  } catch (error) {
    console.error('Prism.js failed to highlight:', error);
  }
});

onUpdated(() => {
  try {
    Prism.highlightAll();
  } catch (error) {
    console.error('Prism.js failed to highlight on update:', error);
  }
});
</script>

<style scoped>
/* Ensure pre tags are responsive */
pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>