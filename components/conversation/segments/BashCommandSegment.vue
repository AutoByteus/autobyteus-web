<template>
  <div class="bg-zinc-800 p-4 rounded-lg border border-zinc-700 shadow-lg my-4">
    <div 
      :class="[
        'bg-zinc-900/50 p-3 border border-zinc-700',
        wasExecuted && commandResult ? 'rounded-t' : 'rounded'
      ]"
    >
      <div class="flex items-start justify-between">
        <!-- Left side: Command and Description -->
        <div class="flex-grow min-w-0 pr-4">
          <!-- Command block that now wraps text -->
          <div class="w-full rounded-sm bg-black/20 p-2">
            <code class="text-zinc-200 font-mono text-sm whitespace-pre-wrap break-words">{{ command }}</code>
          </div>
          <!-- Description below -->
          <p v-if="description" class="text-zinc-400 text-xs mt-2 whitespace-pre-wrap">{{ description }}</p>
        </div>
        
        <!-- Right side: Button -->
        <button
          @click="handleExecute"
          :disabled="isDisabled"
          :class="[
            'px-3 py-1 rounded text-xs font-medium transition-colors duration-200 flex-shrink-0',
            isDisabled
              ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
              : 'bg-indigo-500 hover:bg-indigo-600 text-zinc-100'
          ]"
        >
          <span v-if="isInProgress" class="flex items-center">
            <svg class="animate-spin -ml-1 mr-1 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5_373 0 0 5_373 0 12h4zm2 5_291A7_962 7_962 0 014 12H0c0 3_042 1_135 5_824 3 7_938l3-2_647z"></path>
            </svg>
            Running
          </span>
          <span v-else-if="wasExecuted && commandResult?.success">✓ Re-run</span>
          <span v-else-if="wasExecuted && !commandResult?.success">Retry</span>
          <span v-else>Execute</span>
        </button>
      </div>
    </div>
    
    <!-- Output/Error Display -->
    <div v-if="wasExecuted && commandResult" class="p-3 rounded-b bg-black/30 text-sm font-mono border border-t-0 border-zinc-700">
      <div v-if="!commandResult.success" class="text-red-400">
        <p class="font-bold">Error:</p>
        <pre class="whitespace-pre-wrap mt-1">{{ commandResult.message }}</pre>
      </div>
      <div v-else class="text-zinc-300">
         <p class="font-bold text-green-400">Output:</p>
        <pre class="whitespace-pre-wrap mt-1">{{ commandResult.message || '(No output)' }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import { useBashCommandStore } from '~/stores/bashCommand';
import { useWorkspaceStore } from '~/stores/workspace';

const props = defineProps<{
  command: string;
  description: string;
  conversationId: string;
  messageIndex: number;
  segmentIndex: number;
}>();

const bashCommandStore = useBashCommandStore();
const workspaceStore = useWorkspaceStore();
const wasExecuted = ref(false);

// Create a unique key for this specific command segment instance.
const commandKey = computed(() => `${props.conversationId}:${props.messageIndex}:${props.segmentIndex}`);

const isInProgress = computed(() => 
  bashCommandStore.isApplyCommandInProgress(commandKey.value)
);

const commandResult = computed(() => 
  bashCommandStore.getApplyCommandResult(commandKey.value)
);

const isDisabled = computed(() => isInProgress.value);

// Check if a result already exists in the store for this command (e.g., after reloading a conversation)
watchEffect(() => {
  if (bashCommandStore.getApplyCommandResult(commandKey.value)) {
    wasExecuted.value = true;
  }
});

const handleExecute = async () => {
  const workspaceId = workspaceStore.activeWorkspace?.workspaceId;
  if (!workspaceId) {
    console.error("No active workspace selected. Cannot execute command.");
    // Optionally update state to show an error in the UI
    return;
  }
  
  wasExecuted.value = true; // Mark as executed as soon as the button is clicked.
  
  await bashCommandStore.executeBashCommand(
    workspaceId,
    props.command,
    commandKey.value,
  );
};
</script>

<style scoped>
/* Add any component-specific styles here */
</style>
