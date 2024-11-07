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
    <div ref="controlsRef" class="flex flex-col sm:flex-row justify-end items-stretch sm:items-center p-4 bg-gray-50 border-t border-gray-200 space-y-2 sm:space-y-0">
      <select
        v-if="isFirstMessage()"
        v-model="selectedModel"
        class="w-full sm:w-auto mb-2 sm:mb-0 sm:mr-2 p-2 border border-gray-300 rounded-md text-sm bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
      >
        <option v-for="model in llmModels" :key="model" :value="model">
          {{ model }}
        </option>
      </select>
      
      <!-- Audio recorder component -->
      <AudioRecorder
        :recording="recording"
        :onRecordingComplete="handleAudioRecordingComplete"
      />
      
      <!-- Voice record toggle button -->
      <button
        @click="toggleRecording"
        :class="[
          'w-full sm:w-auto mb-2 sm:mb-0 sm:mr-2 px-4 py-2 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-300 flex items-center justify-center shadow-sm text-white',
          recording ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
        ]"
      >
        <svg :class="{'animate-pulse': recording}" class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
        </svg>
        <span>{{ recording ? 'Recording...' : 'Start Recording' }}</span>
      </button>

      <!-- Search Context Button -->
      <button
        @click="handleSearchContext"
        :disabled="isSending || !userRequirement.trim() || isSearching"
        class="w-full sm:w-auto mb-2 sm:mb-0 sm:mr-2 px-4 py-2 bg-green-500 text-white text-sm rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-all duration-300 flex items-center justify-center shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg v-if="isSearching" class="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
        <svg v-else class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span>{{ isSearching ? 'Searching...' : 'Search Context' }}</span>
      </button>

      <!-- Send button -->
      <button 
        @click="handleSend"
        :disabled="isSending || !userRequirement.trim()"
        class="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-sm"
      >
        <svg v-if="isSending" class="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
        <svg v-else class="h-4 w-4 mr-2" fill="none" viewBox="0 0 20 20">
          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
        </svg>
        <span>{{ isSending ? 'Sending...' : 'Send' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch, onUnmounted } from 'vue';
import { useConversationStore } from '~/stores/conversationStore';
import { useWorkspaceStore } from '~/stores/workspace';
import { useWorkflowStore } from '~/stores/workflow';
import { LlmModel } from '~/generated/graphql';
import AudioRecorder from '~/components/AudioRecorder.vue';
import { useTranscriptionStore } from '~/stores/transcriptionStore';

const conversationStore = useConversationStore();
const workspaceStore = useWorkspaceStore();
const workflowStore = useWorkflowStore();
const transcriptionStore = useTranscriptionStore();

const userRequirement = computed(() => conversationStore.currentRequirement);
const isSending = computed(() => conversationStore.isCurrentlySending);
const textarea = ref<HTMLTextAreaElement | null>(null);
const controlsRef = ref<HTMLDivElement | null>(null);
const textareaHeight = ref(150);
const selectedModel = ref<LlmModel>(LlmModel.Claude_3_5SonnetApi);
const recording = ref(false);
const isSearching = ref(false);

const llmModels = Object.values(LlmModel);

const isFirstMessage = () => {
  return !conversationStore.selectedConversation || conversationStore.conversationMessages.length === 0;
};

const updateRequirement = (event: Event) => {
  const target = event.target as HTMLTextAreaElement;
  conversationStore.updateUserRequirement(target.value);
  adjustTextareaHeight();
};

const toggleRecording = () => {
  recording.value = !recording.value;
};

const handleAudioRecordingComplete = async (blob: Blob) => {
  try {
    // Convert blob to base64
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      const base64data = reader.result as string;
      // Here you would typically send this data to your backend
      console.log('Audio recording complete, base64 data available');
    };
  } catch (error) {
    console.error('Error handling audio recording:', error);
    alert('Failed to process audio recording. Please try again.');
  }
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
    const llmModelToSend = isFirstMessage() ? selectedModel.value : undefined;

    await conversationStore.sendStepRequirementAndSubscribe(
      workspaceId,
      selectedStep.id,
      userRequirement.value,
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

onMounted(() => {
  nextTick(() => {
    adjustTextareaHeight();
    window.addEventListener('resize', handleResize);
  });

  // Watch for transcription results and update user requirement
  watch(
    () => transcriptionStore.transcription,
    (newTranscription) => {
      if (newTranscription) {
        conversationStore.updateUserRequirement(newTranscription);
      }
    }
  );
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

svg.animate-pulse {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>