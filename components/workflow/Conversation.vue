<!-- File: autobyteus-web/components/workflow/Conversation.vue -->
<!-- This component renders a conversation between a user and an AI -->

<template>
  <div class="space-y-4 mb-4">
    <div
      v-for="(message, index) in conversation.messages"
      :key="message.timestamp + '-' + message.type"
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
                    @click="handleApplyFileChange(file.path, file.originalContent)"
                    class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded"
                  >
                    Apply
                  </button>
                </div>
                <pre :class="'language-' + file.language"><code v-html="file.highlightedContent"></code></pre>
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
import { onMounted, onUpdated } from 'vue';
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

// Format the timestamp for display
const formatTimestamp = (date: Date) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Handle applying file changes
const handleApplyFileChange = async (filePath: string, originalContent: string) => {
  try {
    await fileExplorerStore.applyFileChange(workspaceStore.currentSelectedWorkspacePath, filePath, originalContent);
  } catch (error) {
    console.error('Failed to apply file change:', error);
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