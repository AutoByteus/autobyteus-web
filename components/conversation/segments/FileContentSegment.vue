<template>
  <div class="overflow-x-auto">
    <div v-for="file in fileGroup.files" :key="file.path" class="mb-4">
      <div class="flex justify-between items-center bg-gray-200 p-2 rounded-t-md">
        <span class="font-bold">File: {{ file.path }}</span>
        <button
          @click="handleApply(file.path, file.originalContent)"
          :disabled="isApplyDisabled(file.path)"
          :class="[
            'font-bold py-1 px-2 rounded transition-colors duration-200 text-sm',
            isApplyDisabled(file.path)
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-700 text-white'
          ]"
        >
          <span v-if="isInProgress(file.path)">
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Applying...
          </span>
          <span v-else-if="isApplied(file.path)">Applied</span>
          <span v-else>Apply</span>
        </button>
      </div>
      <pre :class="'language-' + file.language + ' w-full overflow-x-auto'"><code v-html="file.highlightedContent"></code></pre>
      <div v-if="getError(file.path)" class="mt-2 p-2 rounded bg-red-100 text-red-800">
        {{ getError(file.path) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useFileExplorerStore } from '~/stores/fileExplorer';
import { useWorkspaceStore } from '~/stores/workspace';

const props = defineProps<{
  fileGroup: {
    files: Array<{
      path: string;
      language: string;
      originalContent: string;
      highlightedContent: string;
    }>;
  };
  conversationId: string;
  messageIndex: number;
}>();

const fileExplorerStore = useFileExplorerStore();
const workspaceStore = useWorkspaceStore();

const applyResults = ref<Record<string, { success: boolean; message: string }>>({});

const isApplyDisabled = (filePath: string) => {
  return isInProgress(filePath) || isApplied(filePath);
};

const isInProgress = (filePath: string) => {
  return fileExplorerStore.isApplyChangeInProgress(props.conversationId, props.messageIndex, filePath);
};

const isApplied = (filePath: string) => {
  return applyResults.value[filePath]?.success;
};

const getError = (filePath: string) => {
  return fileExplorerStore.getApplyChangeError(props.conversationId, props.messageIndex, filePath);
};

const handleApply = async (filePath: string, originalContent: string) => {
  try {
    await fileExplorerStore.applyFileChange(
      workspaceStore.currentSelectedWorkspaceId,
      filePath,
      originalContent,
      props.conversationId,
      props.messageIndex
    );
    applyResults.value[filePath] = { success: true, message: 'Changes applied successfully!' };
  } catch (error) {
    console.error('Failed to apply file change:', error);
    applyResults.value[filePath] = { success: false, message: 'Failed to apply changes. Please try again.' };
    setTimeout(() => {
      delete applyResults.value[filePath];
      fileExplorerStore.setApplyChangeError(props.conversationId, props.messageIndex, filePath, null);
    }, 5000);
  }
};
</script>