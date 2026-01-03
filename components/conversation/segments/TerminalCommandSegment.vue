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
            <svg class="animate-spin -ml-1 mr-1 h-3 w-3" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
      <!-- Error Display -->
      <div v-if="!commandResult.success" class="text-red-400 relative group">
        <div class="flex items-center justify-between">
            <p class="font-bold">Error:</p>
            <button
              v-if="commandResult.message"
              @click="handleCopyOutput"
              title="Use as Input"
              class="absolute top-1 right-1 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-700 hover:bg-zinc-600 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <svg xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 text-zinc-300">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </button>
        </div>
        <pre class="whitespace-pre-wrap mt-1">{{ commandResult.message }}</pre>
      </div>
      
      <!-- Success Output Display -->
      <div v-else class="text-zinc-300 relative group">
        <div class="flex items-center justify-between">
            <p class="font-bold text-green-400">Output:</p>
             <!-- The 'Use as Input' button is now always visible for short outputs or expanded long outputs -->
             <button
              v-if="commandResult.message && (!isLongOutput || isOutputExpanded)"
              @click="handleCopyOutput"
              title="Use as Input"
              class="absolute top-1 right-1 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-700 hover:bg-zinc-600 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 text-zinc-300">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </button>
        </div>
        
        <!-- Short Output -->
        <pre v-if="!isLongOutput" class="whitespace-pre-wrap mt-1">{{ commandResult.message || '(No output)' }}</pre>
        
        <!-- Long, Collapsible Output -->
        <div v-else>
          <!-- Collapsed View -->
          <div v-if="!isOutputExpanded">
            <pre class="whitespace-pre-wrap mt-1">{{ outputPreview }}</pre>
            <button @click="toggleOutputExpansion" class="text-indigo-400 hover:text-indigo-300 text-xs mt-2">
              Show More...
            </button>
          </div>
          
          <!-- Expanded View -->
          <div v-else>
            <div class="max-h-96 overflow-y-auto mt-1 border border-zinc-700 rounded p-2 bg-black/30">
              <pre class="whitespace-pre-wrap">{{ commandResult.message }}</pre>
            </div>
            <button @click="toggleOutputExpansion" class="text-indigo-400 hover:text-indigo-300 text-xs mt-2">
              Show Less
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import { useTerminalCommandStore } from '~/stores/terminalCommand';
import { useWorkspaceStore } from '~/stores/workspace';
import { useActiveContextStore } from '~/stores/activeContextStore';

const props = defineProps<{
  command: string;
  description: string;
  conversationId: string;
  messageIndex: number;
  segmentIndex: number;
}>();

const terminalCommandStore = useTerminalCommandStore();
const workspaceStore = useWorkspaceStore();
const activeContextStore = useActiveContextStore();
const wasExecuted = ref(false);

// Create a unique key for this specific command segment instance.
const commandKey = computed(() => `${props.conversationId}:${props.messageIndex}:${props.segmentIndex}`);

const isInProgress = computed(() => 
  terminalCommandStore.isApplyCommandInProgress(commandKey.value)
);

const commandResult = computed(() => 
  terminalCommandStore.getApplyCommandResult(commandKey.value)
);

const isDisabled = computed(() => isInProgress.value);

// --- New state and logic for collapsible output ---
const isOutputExpanded = ref(false);
const OUTPUT_COLLAPSE_THRESHOLD = 15; // Number of lines to show before collapsing

const outputLines = computed(() => commandResult.value?.message?.split('\n') || []);
const isLongOutput = computed(() => outputLines.value.length > OUTPUT_COLLAPSE_THRESHOLD);

const outputPreview = computed(() => {
  return outputLines.value.slice(0, OUTPUT_COLLAPSE_THRESHOLD).join('\n') + '\n...';
});

const toggleOutputExpansion = () => {
  isOutputExpanded.value = !isOutputExpanded.value;
};
// --- End new logic ---

// Check if a result already exists in the store for this command (e.g., after reloading a conversation)
watchEffect(() => {
  if (terminalCommandStore.getApplyCommandResult(commandKey.value)) {
    wasExecuted.value = true;
  }
});

// Reset expansion state if the command is re-run
watchEffect(() => {
  if (isInProgress.value) {
    isOutputExpanded.value = false;
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
  
  await terminalCommandStore.executeTerminalCommand(
    workspaceId,
    props.command,
    commandKey.value,
  );
};

const handleCopyOutput = () => {
  if (commandResult.value?.message) {
    activeContextStore.updateRequirement(commandResult.value.message);
  }
};
</script>

<style scoped>
/* Add any component-specific styles here */
</style>
