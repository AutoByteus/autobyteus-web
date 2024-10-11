<!-- File: autobyteus-web/components/workflow/Conversation.vue -->
<!-- This component renders a conversation between a user and an AI -->

<template>
  <div class="space-y-4 mb-4">
    <div
      v-for="(message, index) in conversation.messages"
      :key="message.timestamp + '-' + message.type + '-' + index"
      :class="[
        'p-3 rounded-lg max-w-3/4 relative shadow-sm hover:shadow-md transition-shadow duration-200',
        message.type === 'user' ? 'ml-auto bg-blue-100 text-blue-800' : 'mr-auto bg-gray-100 text-gray-800'
      ]"
    >
      <!-- Render user message -->
      <div v-if="message.type === 'user'">
        <div v-if="message.contextFilePaths && message.contextFilePaths.length > 0">
          <strong>Context Files:</strong>
          <ul class="list-disc list-inside">
            <li v-for="file in message.contextFilePaths" :key="file.path" class="truncate">
              {{ file.path }} ({{ file.type }})
            </li>
          </ul>
        </div>
        <div class="mt-2">
          <strong>User:</strong>
          <div>{{ message.text }}</div>
        </div>
      </div>
      <!-- Render AI message -->
      <div v-else>
        <strong>AI:</strong>
        <div>
          <!-- Render each segment of the AI response -->
          <template v-for="(segment, segmentIndex) in parseAIResponse(message.text).segments" :key="segmentIndex">
            <!-- Render text segment -->
            <div v-if="segment.type === 'text'" v-html="formatText(segment.content)" class="mb-4"></div>
            <!-- Render file content segment -->
            <div v-else-if="segment.type === 'file_content'">
              <div v-for="file in segment.fileGroup.files" :key="file.path">
                <div class="flex justify-between items-center bg-gray-200 p-2 rounded-t-md">
                  <span class="font-bold">File: {{ file.path }}</span>
                  <button
                    @click="handleApplyFileChange(conversation.id, index, file.path, file.originalContent)"
                    :disabled="isApplyChangeDisabled(conversation.id, index, file.path)"
                    :class="[
                      'font-bold py-1 px-2 rounded transition-colors duration-200',
                      isApplyChangeDisabled(conversation.id, index, file.path)
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-500 hover:bg-blue-700 text-white'
                    ]"
                  >
                    <!-- Button States -->
                    <span v-if="isApplyChangeInProgress(conversation.id, index, file.path)">
                      <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Applying...
                    </span>
                    <span v-else-if="isApplied(conversation.id, index, file.path)">
                      Applied
                    </span>
                    <span v-else>
                      Apply
                    </span>
                  </button>
                </div>
                <pre :class="'language-' + file.language"><code v-html="file.highlightedContent"></code></pre>
                <div v-if="fileExplorerStore.getApplyChangeError(conversation.id, index, file.path)" class="mt-2 p-2 rounded bg-red-100 text-red-800">
                  {{ fileExplorerStore.getApplyChangeError(conversation.id, index, file.path) }}
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
      <span class="text-xs text-gray-500 absolute bottom-1 right-2">
        {{ formatTimestamp(message.timestamp) }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUpdated, ref } from 'vue';
import type { Conversation } from '~/types/conversation';
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
  conversation: Conversation;
}>();

const fileExplorerStore = useFileExplorerStore();
const workspaceStore = useWorkspaceStore();

// Structure: applyResults[conversationId][messageIndex][filePath] = { success, message }
const applyResults = ref<Record<string, Record<number, Record<string, { success: boolean; message: string }>>>>({});

// Format the timestamp for display
const formatTimestamp = (date: Date) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Check if the apply button should be disabled
const isApplyChangeDisabled = (conversationId: string, messageIndex: number, filePath: string) => {
  return (
    fileExplorerStore.isApplyChangeInProgress(conversationId, messageIndex, filePath) ||
    (applyResults.value[conversationId] &&
      applyResults.value[conversationId][messageIndex] &&
      applyResults.value[conversationId][messageIndex][filePath]?.success)
  );
};

// Check if the apply change is in progress for a specific conversation, message, and file
const isApplyChangeInProgress = (conversationId: string, messageIndex: number, filePath: string) => {
  return fileExplorerStore.isApplyChangeInProgress(conversationId, messageIndex, filePath);
};

// Check if the apply action has been successfully completed for a specific conversation, message, and file
const isApplied = (conversationId: string, messageIndex: number, filePath: string) => {
  return applyResults.value[conversationId]?.[messageIndex]?.[filePath]?.success;
};

// Handle applying file changes
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
      workspaceStore.currentSelectedWorkspacePath,
      filePath,
      originalContent,
      conversationId,
      messageIndex
    );
    applyResults.value[conversationId][messageIndex][filePath] = { success: true, message: 'Changes applied successfully!' };
  } catch (error) {
    console.error('Failed to apply file change:', error);
    applyResults.value[conversationId][messageIndex][filePath] = { success: false, message: 'Failed to apply changes. Please try again.' };
    // Clear the result message after 5 seconds only for failed attempts
    setTimeout(() => {
      if (
        applyResults.value[conversationId] &&
        applyResults.value[conversationId][messageIndex]
      ) {
        delete applyResults.value[conversationId][messageIndex][filePath];
        // If no files left for this message, delete the message entry
        if (Object.keys(applyResults.value[conversationId][messageIndex]).length === 0) {
          delete applyResults.value[conversationId][messageIndex];
        }
        // If no messages left for this conversation, delete the conversation entry
        if (Object.keys(applyResults.value[conversationId]).length === 0) {
          delete applyResults.value[conversationId];
        }
      }
      fileExplorerStore.setApplyChangeError(conversationId, messageIndex, filePath, null);
    }, 5000);
  }
};

// Format text by replacing newlines with <br> tags
const formatText = (text: string) => {
  return text.replace(/\n/g, '<br>');
};

// Highlight code blocks on component mount and update
onMounted(() => {
  Prism.highlightAll();
});

onUpdated(() => {
  Prism.highlightAll();
});
</script>

<style>
/* Add any additional styles here */
</style>