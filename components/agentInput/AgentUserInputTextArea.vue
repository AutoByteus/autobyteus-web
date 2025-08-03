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
      ></textarea>
    </div>

    <!-- Controls container with border top for separation -->
    <div ref="controlsRef" class="flex flex-col sm:flex-row justify-end items-center p-3 bg-gray-50 border-t border-gray-200 space-y-3 sm:space-y-0 sm:space-x-2">
      <!-- All controls are now grouped on the right -->
      <div class="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-2">
        <!-- Unified Model and Settings Selector -->
        <GroupedSelect
          class="min-w-[240px]"
          v-model="selectedModel"
          v-model:autoExecuteTools="autoExecuteTools"
          v-model:parseToolCalls="parseToolCalls"
          :options="groupedModelOptions"
          :loading="isLoadingModels"
          :disabled="isLoadingModels"
          placeholder="Select a model"
        />

        <AudioRecorder
          :disabled="isSending"
        />
        
        <div class="flex flex-col sm:flex-row gap-3 sm:gap-2">
          <button
            @click="handleSearchContext"
            :disabled="isSending || !internalRequirement.trim() || isSearching"
            class="flex items-center justify-center px-4 py-2.5 bg-green-500 text-white text-sm font-medium rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px]"
          >
            <svg v-if="isSearching" class="animate-spin h-4 w-4 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            <svg v-else class="h-4 w-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span class="whitespace-nowrap">{{ isSearching ? 'Searching...' : 'Search Context' }}</span>
          </button>

          <button 
            @click="handleSend"
            :disabled="isSending || !internalRequirement.trim()"
            class="flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px]"
          >
            <svg v-if="isSending" class="animate-spin h-4 w-4 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            <svg v-else class="h-4 w-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
            </svg>
            <span class="whitespace-nowrap">{{ isSending ? 'Sending...' : 'Send' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useAgentRunStore } from '~/stores/agentRunStore';
import { useLLMProviderConfigStore } from '~/stores/llmProviderConfig';
import AudioRecorder from '~/components/AudioRecorder.vue';
import GroupedSelect from '~/components/agentInput/GroupedSelect.vue';

// Initialize stores
const agentRunStore = useAgentRunStore();
const llmProviderConfigStore = useLLMProviderConfigStore();

// Store refs
const { currentRequirement: storeCurrentRequirement, isCurrentlySending } = storeToRefs(agentRunStore);
const { isLoadingModels, providersWithModels } = storeToRefs(llmProviderConfigStore);

// Local component state
const internalRequirement = ref(''); // Local state for textarea
const isSending = computed(() => isCurrentlySending.value);
const textarea = ref<HTMLTextAreaElement | null>(null);
const controlsRef = ref<HTMLDivElement | null>(null);
const textareaHeight = ref(150);
const isSearching = ref(false);

// Computed properties for v-model binding to the store
const selectedModel = computed({
  get: () => agentRunStore.selectedAgent?.config.llmModelName ?? null,
  set: (value: string | null) => agentRunStore.updateSelectedAgentConfig({ llmModelName: value ?? '' })
});

const autoExecuteTools = computed({
  get: () => agentRunStore.selectedAgent?.config.autoExecuteTools ?? false,
  set: (value: boolean) => agentRunStore.updateSelectedAgentConfig({ autoExecuteTools: value })
});

const parseToolCalls = computed({
  get: () => agentRunStore.selectedAgent?.config.parseToolCalls ?? true,
  set: (value: boolean) => agentRunStore.updateSelectedAgentConfig({ parseToolCalls: value })
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
      agentRunStore.updateUserRequirement(text);
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
    agentRunStore.updateUserRequirement(internalRequirement.value);
  }
};

const handleBlur = () => {
  flushDebouncedUpdateStore(); 
};

const handleSend = async () => {
  if (!internalRequirement.value.trim()) {
    alert('Please enter a user requirement before sending.');
    return;
  }
  syncStoreImmediately(); 

  try {
    await agentRunStore.sendUserInputAndSubscribe();
  } catch (error) {
    console.error('Error sending requirement:', error);
    alert('Failed to send requirement. Please try again.');
  }
};

const handleSearchContext = async () => {
  console.log('Search Context button clicked, but functionality is not yet implemented.');
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
      selectedModel.value = allModels[0];;
    }
  } catch (error) {
    console.error('Failed to fetch available models:', error);
  }
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
  initializeModels();
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
