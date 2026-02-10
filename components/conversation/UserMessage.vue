<template>
  <div class="relative group">
    <!-- Copy Button: Visible on hover -->
    <div class="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      <CopyButton :text-to-copy="message.text" label="Copy message" />
    </div>

    <div class="flex items-start gap-3 pr-8">
      <div class="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-white border border-sky-200 flex items-center justify-center">
        <img
          v-if="showAvatarImage"
          :src="userAvatarUrl || ''"
          :alt="`${displayUserName} avatar`"
          class="h-full w-full object-cover"
          @error="avatarLoadError = true"
        />
        <svg
          v-else
          class="h-8 w-8 text-sky-600"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-3.86 0-7 2.24-7 5a1 1 0 1 0 2 0c0-1.42 2.22-3 5-3s5 1.58 5 3a1 1 0 1 0 2 0c0-2.76-3.14-5-7-5Z"
          />
        </svg>
      </div>

      <div class="min-w-0 flex-1">
        <p class="text-xs font-semibold uppercase tracking-wide text-blue-800">{{ displayUserName }}</p>
        <div v-if="message.contextFilePaths && message.contextFilePaths.length > 0" class="mt-1">
          <p class="font-semibold">Context Files:</p>
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
        <div class="mt-1 whitespace-pre-wrap">{{ message.text }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { UserMessage } from '~/types/conversation';
import { useFileExplorerStore } from '~/stores/fileExplorer';
import CopyButton from '~/components/common/CopyButton.vue';

import { useWorkspaceStore } from '~/stores/workspace';
const props = defineProps<{
  message: UserMessage;
  userDisplayName?: string;
  userAvatarUrl?: string | null;
}>();

const fileExplorerStore = useFileExplorerStore();
const workspaceStore = useWorkspaceStore();
const avatarLoadError = ref(false);

const displayUserName = computed(() => props.userDisplayName?.trim() || 'You');
const showAvatarImage = computed(() => Boolean(props.userAvatarUrl) && !avatarLoadError.value);

watch(() => props.userAvatarUrl, () => {
  avatarLoadError.value = false;
});

const handleFileClick = (filePath: string) => {
  const wsId = workspaceStore.activeWorkspace?.workspaceId;
  if(wsId) fileExplorerStore.openFile(filePath, wsId);
};
</script>

<style scoped>
/* Styles specific to UserMessage, if any, go here */
/* The whitespace-pre-wrap class is provided by Tailwind CSS */
</style>
