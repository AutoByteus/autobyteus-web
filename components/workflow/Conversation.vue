<!-- File: autobyteus-web/components/workflow/Conversation.vue -->

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
      <div v-else>
        <strong>AI:</strong>
        <div>
          <template v-for="(item, itemIndex) in parseAIResponse(message.text)" :key="itemIndex">
            <div v-if="item.type === 'text'" v-html="formatText(item.content)" class="mb-4"></div>
            <div v-else-if="item.type === 'code'">
              <div class="flex justify-between items-center bg-gray-200 p-2 rounded-t-md">
                <span class="font-bold">File: {{ item.path }}</span>
                <button
                  @click="handleApplyFileChange(item.path, item.content)"
                  class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded"
                >
                  Apply
                </button>
              </div>
              <pre :class="'language-' + item.language"><code v-html="item.highlightedCode"></code></pre>
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
import { parseAIResponse } from '~/utils/codeBlockParser';
import { useFileExplorerStore } from '~/stores/fileExplorer';
import { useWorkspaceStore } from '~/stores/workspace';

const props = defineProps<{
  conversation: Conversation;
}>();

const fileExplorerStore = useFileExplorerStore();
const workspaceStore = useWorkspaceStore();

const formatTimestamp = (date: Date) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const handleApplyFileChange = async (filePath: string, content: string) => {
  try {
    await fileExplorerStore.applyFileChange(workspaceStore.currentSelectedWorkspacePath, filePath, content);
  } catch (error) {
    console.error('Failed to apply file change:', error);
  }
};

const formatText = (text: string) => {
  // Replace newlines with <br> tags
  return text.replace(/\n/g, '<br>');
};

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
