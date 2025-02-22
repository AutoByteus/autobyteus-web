<template>
  <div class="flex flex-col bg-white focus-within:ring-2 focus-within:ring-blue-500">
    <!-- Textarea container -->
    <div class="flex-grow">
      <textarea
        :value="userRequirement"
        @input="updateRequirement"
        ref="textarea"
        class="w-full p-4 border-0 focus:ring-0 focus:outline-none resize-none bg-transparent"
        :style="{ height: textareaHeight + 'px', minHeight: '150px' }"
        placeholder="Enter your requirement here..."
        @keydown="handleKeyDown"
      ></textarea>
    </div>

    <!-- Controls container with border top for separation -->
    <div ref="controlsRef" class="flex flex-col sm:flex-row justify-end items-stretch sm:items-center p-3 bg-gray-50 border-t border-gray-200 space-y-3 sm:space-y-0 sm:space-x-2">
      <select
        v-if="isFirstMessage()"
        v-model="selectedModel"
        class="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200"
        :disabled="isLoadingModels"
      >
        <option v-if="isLoadingModels" value="">Loading models...</option>
        <option v-else-if="availableModels.length === 0" value="">No models available</option>
        <option v-for="model in availableModels" :key="model" :value="model">
          {{ model }}
        </option>
      </select>
      
      <!-- Audio recorder component -->
      <AudioRecorder
        :disabled="isSending"
      />
      
      <div class="flex flex-col sm:flex-row gap-3 sm:gap-2">
        <!-- Search Context Button -->
        <button
          @click="handleSearchContext"
          :disabled="isSending || !userRequirement.trim() || isSearching"
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

        <!-- Send button -->
        <button 
          @click="handleSend"
          :disabled="isSending || !userRequirement.trim()"
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
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch, onUnmounted } from 'vue';
import { useConversationStore } from '~/stores/conversationStore';
import { useWorkspaceStore } from '~/stores/workspace';
import { useWorkflowStore } from '~/stores/workflow';
import { useLLMProviderConfigStore } from '~/stores/llmProviderConfig';
import AudioRecorder from '~/components/AudioRecorder.vue';

const conversationStore = useConversationStore();
const workspaceStore = useWorkspaceStore();
const workflowStore = useWorkflowStore();
const llmProviderConfigStore = useLLMProviderConfigStore();

const userRequirement = computed(() => conversationStore.currentRequirement);
const isSending = computed(() => conversationStore.isCurrentlySending);
const textarea = ref<HTMLTextAreaElement | null>(null);
const controlsRef = ref<HTMLDivElement | null>(null);
const textareaHeight = ref(150);

// Computed property for selectedModel that gets/sets the conversation's model selection.
const selectedModel = computed({
  get: () => conversationStore.currentModelSelection,
  set: (value: string) => conversationStore.updateModelSelection(value)
});

const isSearching = ref(false);
const isLoadingModels = ref(true);

const availableModels = computed(() => llmProviderConfigStore.models);

const isFirstMessage = () => {
  return !conversationStore.selectedConversation || conversationStore.conversationMessages.length === 0;
};

const updateRequirement = (event: Event) => {
  const target = event.target as HTMLTextAreaElement;
  conversationStore.updateUserRequirement(target.value);
  adjustTextareaHeight();
};

const handleSend = async () => {
  if (!userRequirement.value.trim()) {
    alert('Please enter a user requirement before sending.');
    return;
  }

  const workspaceId = workspaceStore.currentSelectedWorkspaceId;
  const selectedStep = workflowStore.selectedStep;

  if (!workspaceId || !selectedStep) {
    alert('Workspace or step is not selected.');
    return;
  }

  try {
    // Use the selectedModel from the computed property
    const llmModelToSend = isFirstMessage() ? selectedModel.value : undefined;

    await conversationStore.sendStepRequirementAndSubscribe(
      workspaceId,
      selectedStep.id,
      llmModelToSend
    );

    adjustTextareaHeight();
  } catch (error) {
    console.error('Error sending requirement:', error);
    alert('Failed to send requirement. Please try again.');
  }
};

const handleSearchContext = async () => {
  if (!userRequirement.value.trim()) {
    alert('Please enter a requirement to search context.');
    return;
  }

  isSearching.value = true;
  try {
    await conversationStore.searchContextFiles(userRequirement.value);
    // Scroll to context files area for better UX
    document.querySelector('.context-files-area')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  } catch (error) {
    console.error('Error searching context:', error);
    alert('Failed to search context. Please try again.');
  } finally {
    isSearching.value = false;
  }
};

const adjustTextareaHeight = () => {
  if (textarea.value) {
    textarea.value.style.height = '150px';
    const scrollHeight = textarea.value.scrollHeight;
    const controlsHeight = controlsRef.value?.offsetHeight || 0;
    const maxHeight = window.innerHeight * 0.6;
    const newHeight = Math.min(
      Math.max(scrollHeight, 150),
      maxHeight - controlsHeight - 40
    );
    textarea.value.style.height = `${newHeight}px`;
    textareaHeight.value = newHeight;
  }
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
  isLoadingModels.value = true;
  try {
    await llmProviderConfigStore.fetchModels();
    // Only set a default model if no model has already been selected.
    if (availableModels.value.length > 0 && !selectedModel.value) {
      selectedModel.value = availableModels.value[0];
    }
  } catch (error) {
    console.error('Failed to fetch available models:', error);
  } finally {
    isLoadingModels.value = false;
  }
};

onMounted(() => {
  nextTick(() => {
    adjustTextareaHeight();
    window.addEventListener('resize', handleResize);
    initializeModels();
  });
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

watch(userRequirement, () => {
  nextTick(() => {
    adjustTextareaHeight();
  });
});
</script>

<style scoped>
textarea {
  outline: none;
  overflow-y: auto;
}

/* Hide scrollbar for Chrome, Safari and Opera */
textarea::-webkit-scrollbar {
  display: none;
}

/* Hide scrollbar for IE, Edge and Firefox */
textarea {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
</style>
