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
      
      <!-- Audio recorder wrapper -->
      <div class="w-full sm:w-auto mb-2 sm:mb-0 sm:mr-2">
        <AudioRecorder
          v-if="showAudioRecorder"
          :onRecordingComplete="handleAudioRecordingComplete"
          @close="showAudioRecorder = false"
        />
      </div>
      
      <!-- Voice record toggle button -->
      <button
        @click="toggleAudioRecorder"
        class="w-full sm:w-auto mb-2 sm:mb-0 sm:mr-2 px-4 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-all duration-300 flex items-center justify-center shadow-sm"
      >
        <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
        </svg>
        <span>Voice</span>
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
        <svg v-else class="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
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
import { useConversationHistoryStore } from '~/stores/conversationHistory';
import { useWorkspaceStore } from '~/stores/workspace';
import { useWorkflowStore } from '~/stores/workflow';
import { LlmModel } from '~/generated/graphql';
import AudioRecorder from '~/components/AudioRecorder.vue';

const conversationStore = useConversationStore();
const conversationHistoryStore = useConversationHistoryStore();
const workspaceStore = useWorkspaceStore();
const workflowStore = useWorkflowStore();

const userRequirement = computed(() => conversationStore.currentRequirement);
const isSending = computed(() => conversationStore.isCurrentlySending);
const textarea = ref<HTMLTextAreaElement | null>(null);
const controlsRef = ref<HTMLDivElement | null>(null);
const textareaHeight = ref(150);
const selectedModel = ref<LlmModel>(LlmModel.Claude_3_5SonnetApi);
const showAudioRecorder = ref(false);

const llmModels = Object.values(LlmModel);

const isFirstMessage = () => {
  return !conversationStore.currentConversation || conversationStore.conversationMessages.length === 0;
};

const updateRequirement = (event: Event) => {
  const target = event.target as HTMLTextAreaElement;
  conversationStore.updateUserRequirement(target.value);
  adjustTextareaHeight();
};

const toggleAudioRecorder = () => {
  showAudioRecorder.value = !showAudioRecorder.value;
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
    showAudioRecorder.value = false;
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