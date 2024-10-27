<template>
  <div class="bg-zinc-800 p-4 rounded-lg border border-zinc-700 shadow-lg">
    <div class="space-y-2">
      <div v-for="(command, cmdIndex) in commands" :key="cmdIndex" 
           class="flex items-center justify-between bg-zinc-900/50 p-2 rounded border border-zinc-700">
        <code class="text-zinc-200 font-mono text-sm">{{ command }}</code>
        <button
          @click="handleExecute(cmdIndex, command)"
          :disabled="isDisabled(cmdIndex)"
          :class="[
            'ml-3 px-3 py-1 rounded text-xs font-medium transition-colors duration-200',
            isDisabled(cmdIndex)
              ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
              : 'bg-indigo-500 hover:bg-indigo-600 text-zinc-100'
          ]"
        >
          <span v-if="isInProgress(cmdIndex)" class="flex items-center">
            <svg class="animate-spin -ml-1 mr-1 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Running
          </span>
          <span v-else-if="isExecuted(cmdIndex)">✓ Done</span>
          <span v-else>Execute</span>
        </button>
      </div>
    </div>
    <div v-if="getError()" class="mt-3 p-2 rounded bg-red-900/20 text-red-400 text-sm border border-red-800/30">
      {{ getError() }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBashCommandStore } from '~/stores/bashCommand';
import { useWorkspaceStore } from '~/stores/workspace';

const props = defineProps<{
  commands: string[];
  conversationId: string;
  messageIndex: number;
}>();

const bashCommandStore = useBashCommandStore();
const workspaceStore = useWorkspaceStore();

const isDisabled = (cmdIndex: number) => {
  return isInProgress(cmdIndex) || isExecuted(cmdIndex);
};

const isInProgress = (cmdIndex: number) => {
  return bashCommandStore.isApplyCommandInProgress(props.conversationId, props.messageIndex, cmdIndex);
};

const isExecuted = (cmdIndex: number) => {
  return bashCommandStore.isCommandExecuted(props.conversationId, props.messageIndex, cmdIndex);
};

const getError = () => {
  return bashCommandStore.getApplyCommandError(props.conversationId, props.messageIndex);
};

const handleExecute = async (cmdIndex: number, command: string) => {
  try {
    await bashCommandStore.executeBashCommand(
      workspaceStore.currentSelectedWorkspaceId,
      command,
      props.conversationId,
      props.messageIndex,
      cmdIndex
    );
  } catch (error) {
    console.error('Failed to execute bash command:', error);
  }
};
</script>