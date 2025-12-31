<template>
  <div class="flex flex-col bg-white focus-within:ring-2 focus-within:ring-blue-500">
    <!-- Textarea container -->
    <div class="flex-grow">
      <textarea
        :value="internalRequirement"
        @input="handleInput"
        ref="textarea"
        class="w-full p-4 border-0 focus:ring-0 focus:outline-none resize-none bg-transparent"
        :style="{ height: textareaHeight + 'px', minHeight: '150px' }"
        placeholder="Enter your requirement here..."
        @keydown="handleKeyDown"
        @blur="handleBlur"
        :disabled="!activeContextStore.activeAgentContext"
        @dragover.prevent
        @drop.prevent="handleDrop"
        data-file-drop-target="true"
      ></textarea>
    </div>

    <!-- Controls container with border top for separation -->
    <div ref="controlsRef" class="flex flex-col sm:flex-row sm:flex-wrap justify-end items-center p-3 bg-gray-50 border-t border-gray-200 gap-2">
      <!-- Unified Model and Settings Selector -->
      <GroupedSelect
        class="min-w-[240px] w-full sm:w-auto"
        v-model="selectedModel"
        v-model:autoExecuteTools="autoExecuteTools"
        v-model:parseToolCalls="parseToolCalls"
        v-model:useXmlToolFormat="useXmlToolFormat"
        :options="groupedModelOptions"
        :loading="isLoadingModels"
        :disabled="isLoadingModels || !activeContextStore.activeAgentContext"
        placeholder="Select a model"
      />

      <!-- Hidden behind feature flag for future use -->
      <AudioRecorder
        v-if="ENABLE_AUDIO_RECORDER"
        :disabled="true"
        title="Voice input is coming soon"
        class="w-full sm:w-auto"
      />

      <button 
        @click="handleSend"
        :disabled="isSending || !internalRequirement.trim() || !activeContextStore.activeAgentContext"
        :title="isSending ? 'Sending...' : 'Send message'"
        class="flex items-center justify-center p-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px] min-w-[40px]"
      >
        <svg v-if="isSending" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
        <Icon v-else icon="heroicons:paper-airplane-solid" class="h-5 w-5" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useActiveContextStore } from '~/stores/activeContextStore';
import { useLLMProviderConfigStore } from '~/stores/llmProviderConfig';
import { useServerStore } from '~/stores/serverStore';
import { useWorkspaceStore } from '~/stores/workspace';
import AudioRecorder from '~/components/AudioRecorder.vue';

import GroupedSelect from '~/components/agentInput/GroupedSelect.vue';
import { Icon } from '@iconify/vue';
import { getFilePathsFromFolder } from '~/utils/fileExplorer/fileUtils';
import type { TreeNode } from '~/utils/fileExplorer/TreeNode';

// Feature flags
const ENABLE_AUDIO_RECORDER = false; // Set to true to enable the audio recorder feature

// Initialize stores
const activeContextStore = useActiveContextStore();
const llmProviderConfigStore = useLLMProviderConfigStore();
const serverStore = useServerStore();
const workspaceStore = useWorkspaceStore();

// Store refs
const { isSending, currentRequirement: storeCurrentRequirement } = storeToRefs(activeContextStore);
const { isLoadingModels, providersWithModels } = storeToRefs(llmProviderConfigStore);
const { isElectron } = storeToRefs(serverStore);

// Local component state
const internalRequirement = ref(''); // Local state for textarea
const textarea = ref<HTMLTextAreaElement | null>(null);
const controlsRef = ref<HTMLDivElement | null>(null);
const textareaHeight = ref(150);

const platform = ref<'win32' | 'linux' | 'darwin'>('linux');

// Computed properties for v-model binding to the store
const selectedModel = computed({
  get: () => activeContextStore.activeConfig?.llmModelIdentifier ?? null,
  set: (value: string | null) => {
    if (value !== null) {
      activeContextStore.updateConfig({ llmModelIdentifier: value });
    }
  }
});

const autoExecuteTools = computed({
  get: () => activeContextStore.activeConfig?.autoExecuteTools ?? false,
  set: (value: boolean) => {
    activeContextStore.updateConfig({ autoExecuteTools: value });
  }
});

const parseToolCalls = computed({
  get: () => activeContextStore.activeConfig?.parseToolCalls ?? true,
  set: (value: boolean) => {
    activeContextStore.updateConfig({ parseToolCalls: value });
  }
});

const useXmlToolFormat = computed({
  get: () => activeContextStore.activeConfig?.useXmlToolFormat ?? false,
  set: (value: boolean) => {
    activeContextStore.updateConfig({ useXmlToolFormat: value });
  }
});

const groupedModelOptions = computed(() => {
  if (!providersWithModels.value) return [];
  return providersWithModels.value.map(group => ({
    label: group.provider,
    items: group.models,
  }));
});

// Enhanced Debounce function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): { call: (...args: Parameters<T>) => void; cancel: () => void; flush: () => void; } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | undefined;

  const call = (...args: Parameters<T>) => {
    lastArgs = args;
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      if (lastArgs) {
        func.apply(this, lastArgs);
      }
      timeoutId = null;
      lastArgs = undefined;
    }, delay);
  };

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
      lastArgs = undefined;
    }
  };

  const flush = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
      if (lastArgs) {
        func.apply(this, lastArgs);
        lastArgs = undefined;
      }
    }
  };

  return { call, cancel, flush };
}

const adjustTextareaHeight = () => {
  if (textarea.value) {
    textarea.value.style.height = '150px'; 
    const scrollHeight = textarea.value.scrollHeight;
    const controlsHeight = controlsRef.value?.offsetHeight || 0;
    const maxHeight = window.innerHeight * 0.6; 
    const newHeight = Math.min(Math.max(scrollHeight, 150), maxHeight - controlsHeight - 40);
    textarea.value.style.height = `${newHeight}px`;
    textareaHeight.value = newHeight;
  }
};

const { call: debouncedUpdateStore, cancel: cancelDebouncedUpdateStore, flush: flushDebouncedUpdateStore } = 
  debounce((text: string) => {
    if (text !== storeCurrentRequirement.value) {
      activeContextStore.updateRequirement(text);
    }
  }, 750);

watch(storeCurrentRequirement, (newValFromStore) => {
  if (newValFromStore !== internalRequirement.value) {
    internalRequirement.value = newValFromStore;
    nextTick(adjustTextareaHeight); 
  }
}, { immediate: true }); 

const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement;
  internalRequirement.value = target.value; 
  nextTick(adjustTextareaHeight);
  debouncedUpdateStore(internalRequirement.value);
};

const syncStoreImmediately = () => {
  cancelDebouncedUpdateStore(); 
  if (internalRequirement.value !== storeCurrentRequirement.value) {
    activeContextStore.updateRequirement(internalRequirement.value);
  }
};

const handleBlur = () => {
  flushDebouncedUpdateStore(); 
};

const handleSend = async () => {
  syncStoreImmediately(); 
  try {
    await activeContextStore.send();
  } catch (error) {
    console.error('Error sending requirement:', error);
    alert('Failed to send requirement. Please try again.');
  }
};



const insertFilePaths = (filePaths: string[]) => {
  if (!textarea.value || filePaths.length === 0) return;

  const textToInsert = filePaths.join(' ');
  const start = textarea.value.selectionStart;
  const end = textarea.value.selectionEnd;
  
  const newText = internalRequirement.value.substring(0, start) + textToInsert + internalRequirement.value.substring(end);
  internalRequirement.value = newText;

  nextTick(adjustTextareaHeight);
  debouncedUpdateStore(internalRequirement.value);

  nextTick(() => {
    if (textarea.value) {
      const newCursorPos = start + textToInsert.length;
      textarea.value.focus();
      textarea.value.setSelectionRange(newCursorPos, newCursorPos);
    }
  });
};

const handleDrop = async (event: DragEvent) => {
  if (!activeContextStore.activeAgentContext) return;
  
  const dataTransfer = event.dataTransfer;
  if (!dataTransfer) return;

  let filePaths: string[] = [];
  const dragData = dataTransfer.getData('application/json');

  if (dragData) {
    console.log('[INFO] Drop event is from internal file explorer.');
    try {
      const droppedNode: TreeNode = JSON.parse(dragData);
      filePaths = getFilePathsFromFolder(droppedNode);

      // This logic to make paths absolute seems better placed here than in the context file area
      if (workspaceStore.activeWorkspace?.absolutePath) {
        const basePath = workspaceStore.activeWorkspace.absolutePath;
        const separator = basePath.includes('\\') ? '\\' : '/';
        filePaths = filePaths.map(relativePath => {
          // Ensure relativePath doesn't start with a slash
          const cleanRelativePath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
          const parts = [basePath.replace(/[/\\]$/, ''), ...cleanRelativePath.split('/')];
          return parts.join(separator);
        });
      }
    } catch (error) {
      console.error('Failed to parse dropped node data:', error);
    }
  } else if (isElectron.value && dataTransfer.files.length > 0 && window.electronAPI) {
    console.log('[INFO] Drop event from native OS in Electron.');
    const files = Array.from(dataTransfer.files);
    const pathPromises = files.map(f => window.electronAPI.getPathForFile(f));
    const paths = (await Promise.all(pathPromises)).filter((p): p is string => Boolean(p));
    filePaths = paths;
    console.log('[INFO] Received native file paths from preload bridge:', filePaths);
  } else if (!isElectron.value && dataTransfer.files.length > 0) {
    console.log('[INFO] Drop event from native OS in browser, using filenames as fallback.');
    filePaths = Array.from(dataTransfer.files).map(file => file.name);
  }
  
  insertFilePaths(filePaths);
};

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.altKey) {
    event.preventDefault();
    handleSend();
  }
};

const handleResize = () => {
  adjustTextareaHeight();
};

const initializeModels = async () => {
  try {
    await llmProviderConfigStore.fetchProvidersWithModels();
    const allModels = llmProviderConfigStore.models;
    if (allModels.length > 0 && (!selectedModel.value || !allModels.includes(selectedModel.value))) {
      // Don't auto-select a model. Let the user choose.
    }
  } catch (error) {
    console.error('Failed to fetch available models:', error);
  }
};

onMounted(async () => {
  window.addEventListener('resize', handleResize);
  initializeModels();

  if (window.electronAPI) {
    try {
      platform.value = await window.electronAPI.getPlatform();
      console.log(`[INFO] Detected platform: ${platform.value}`);
    } catch (error) {
      console.error('Failed to get platform from Electron API:', error);
    }
  }
});

onUnmounted(() => {
  flushDebouncedUpdateStore(); 
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
textarea {
  outline: none;
  overflow-y: auto;
}
textarea::-webkit-scrollbar { display: none; }
textarea { -ms-overflow-style: none; scrollbar-width: none; }
</style>
