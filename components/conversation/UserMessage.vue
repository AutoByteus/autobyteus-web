<template>
  <div class="relative group pr-8">
    <!-- Copy Button: Visible on hover -->
    <div class="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      <CopyButton :text-to-copy="message.text" label="Copy message" />
    </div>

    <div v-if="message.contextFilePaths && message.contextFilePaths.length > 0">
      <strong>Context Files:</strong>
      <ul class="list-disc list-inside">
        <li v-for="file in message.contextFilePaths" :key="file.path" class="flex items-baseline">
          <span
            @click="handleFileClick(file.path)"
            class="cursor-pointer hover:underline truncate"
            :title="`Open ${file.path}`"
          >
            {{ file.path }}
          </span>
        </li>
      </ul>
    </div>
    <div class="mt-2">
      <strong>User:</strong>
      <!-- Apply CSS to preserve whitespace and line breaks -->
      <div class="whitespace-pre-wrap">{{ message.text }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UserMessage } from '~/types/conversation';
import { useFileExplorerStore } from '~/stores/fileExplorer';
import CopyButton from '~/components/common/CopyButton.vue';

import { useWorkspaceStore } from '~/stores/workspace';
const props = defineProps<{
  message: UserMessage;
}>();

const fileExplorerStore = useFileExplorerStore();
const workspaceStore = useWorkspaceStore();

const handleFileClick = (filePath: string) => {
  const wsId = workspaceStore.activeWorkspace?.workspaceId;
  if(wsId) fileExplorerStore.openFile(filePath, wsId);
};
</script>

<style scoped>
/* Styles specific to UserMessage, if any, go here */
/* The whitespace-pre-wrap class is provided by Tailwind CSS */
</style>
