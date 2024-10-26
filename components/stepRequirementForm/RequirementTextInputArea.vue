<template>
  <div class="flex flex-col bg-white focus-within:ring-2 focus-within:ring-blue-500">
    <!-- Textarea container -->
    <div class="flex-grow">
      <textarea
        v-model="userRequirement"
        ref="textarea"
        class="w-full p-4 border-0 focus:ring-0 focus:outline-none resize-none bg-transparent"
        :style="{ height: textareaHeight + 'px', minHeight: '150px' }"
        placeholder="Enter your requirement here..."
        @input="adjustTextareaHeight"
        @keydown="handleKeyDown"
      ></textarea>
    </div>

    <!-- Controls container with border top for separation -->
    <div
      ref="controlsRef"
      class="flex flex-col sm:flex-row justify-end items-stretch sm:items-center p-4 bg-gray-50 border-t border-gray-200 space-y-2 sm:space-y-0"
    >
      <select
        v-if="isFirstMessage()"
        v-model="selectedModel"
        class="w-full sm:w-auto mb-2 sm:mb-0 sm:mr-2 p-2 border border-gray-300 rounded-md text-sm bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
      >
        <option v-for="model in llmModels" :key="model" :value="model">
          {{ model }}
        </option>
      </select>

      <!-- Record Button -->
      <button
        @click="openRecordingModal"
        class="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-300 flex items-center justify-center shadow-sm"
      >
        <svg
          class="h-4 w-4 mr-2"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <!-- Microphone icon -->
          <path
            fill-rule="evenodd"
            d="M10 1a3 3 0 00-3 3v5a3 3 0 106 0V4a3 3 0 00-3-3zM7 8V4a3 3 0 116 0v4a3 3 0 11-6 0zM5 9a5 5 0 0010 0V4a5 5 0 10-10 0v5zm3 6a7 7 0 007-7h2a9 9 0 01-9 9V15z"
            clip-rule="evenodd"
          />
        </svg>
        <span>Record</span>
      </button>

      <!-- Transcribe Button (appears after loading audio) -->
      <button
        v-if="showTranscribeButton"
        @click="handleTranscribe"
        class="w-full sm:w-auto px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-all duration-300 flex items-center justify-center shadow-sm"
      >
        <svg
          class="h-4 w-4 mr-2"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <!-- Transcribe icon -->
          <path
            fill-rule="evenodd"
            d="M4 3a1 1 0 011-1h2a1 1 0 010 2H6v12h1a1 1 0 110 2H5a1 1 0 01-1-1V3zm10 0a1 1 0 00-1-1h-2a1 1 0 000 2h1v12h-1a1 1 0 000 2h2a1 1 0 001-1V3z"
            clip-rule="evenodd"
          />
        </svg>
        <span>Transcribe</span>
      </button>

      <!-- Send Button -->
      <button
        @click="handleSend"
        :disabled="isSending || !userRequirement.trim()"
        class="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-sm"
      >
        <svg
          v-if="isSending"
          class="animate-spin h-4 w-4 mr-2"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          ></path>
        </svg>
        <svg
          v-else
          class="h-4 w-4 mr-2"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"
          ></path>
        </svg>
        <span>{{ isSending ? 'Sending...' : 'Send' }}</span>
      </button>
    </div>
  </div>

  <!-- Recording Modal -->
  <div
    v-if="isRecordingModalOpen"
    class="fixed inset-0 flex items-center justify-center z-50"
  >
    <div class="absolute inset-0 bg-black opacity-50"></div>
    <div class="bg-white p-6 rounded-lg z-10">
      <AudioRecorder @onRecordingComplete="handleRecordingComplete" />
      <div class="mt-4 flex justify-end">
        <button
          @click="closeRecordingModal"
          class="px-4 py-2 bg-gray-600 text-white rounded-md"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useWorkflowStore } from '~/stores/workflow';
import { useWorkflowStepStore } from '~/stores/workflowStep';
import { useWorkspaceStore } from '~/stores/workspace';
import { LlmModel } from '~/generated/graphql';
import AudioRecorder from '~/components/AudioRecorder.vue';
import { formatAudioTimestamp } from '~/utils/AudioUtils';

const workflowStore = useWorkflowStore();
const workflowStepStore = useWorkflowStepStore();
const workspaceStore = useWorkspaceStore();

const { userRequirement } = storeToRefs(workflowStepStore);
const isSending = computed(() => workflowStepStore.isCurrentlySending);
const textarea = ref<HTMLTextAreaElement | null>(null);
const controlsRef = ref<HTMLDivElement | null>(null);
const textareaHeight = ref(150); // Initial height
const selectedModel = ref<LlmModel>(LlmModel.Claude_3_5SonnetApi);

const llmModels = Object.values(LlmModel);

const isFirstMessage = () => {
  const stepId = workflowStore.selectedStep?.id;
  return stepId ? workflowStepStore.isFirstMessage(stepId) : false;
};

const handleSend = async () => {
  if (!userRequirement.value.trim()) {
    alert('Please enter a user requirement before sending.');
    return;
  }

  const workspaceId = workspaceStore.currentSelectedWorkspaceId;
  const stepId = workflowStore.selectedStep?.id;

  if (!workspaceId || !stepId) {
    alert('Workspace or step is not selected.');
    return;
  }

  try {
    if (!workflowStepStore.getActiveConversationId(stepId)) {
      workflowStepStore.createNewConversation(stepId);
    }

    await workflowStepStore.sendStepRequirementAndSubscribe(
      workspaceId,
      stepId,
      userRequirement.value,
      isFirstMessage() ? selectedModel.value : undefined
    );

    userRequirement.value = '';
    adjustTextareaHeight();
  } catch (error) {
    console.error('Error sending requirement:', error);
    alert('Failed to send requirement. Please try again.');
  }
};

const adjustTextareaHeight = () => {
  if (textarea.value) {
    // Reset height to allow proper calculation
    textarea.value.style.height = '150px';

    // Get the scroll height and controls height
    const scrollHeight = textarea.value.scrollHeight;
    const controlsHeight = controlsRef.value?.offsetHeight || 0;

    // Calculate available height (viewport height minus other elements)
    const maxHeight = window.innerHeight * 0.6; // 60% of viewport height

    // Calculate new height considering minimum, maximum, and controls
    const newHeight = Math.min(
      Math.max(scrollHeight, 150), // Min height 150px
      maxHeight - controlsHeight - 40 // Subtract controls height and padding
    );

    // Apply the new height
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

// Resize handler for window resize
const handleResize = () => {
  adjustTextareaHeight();
};

onMounted(() => {
  nextTick(() => {
    adjustTextareaHeight();
    window.addEventListener('resize', handleResize);
  });
});

// Clean up resize listener
onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

watch(userRequirement, () => {
  workflowStepStore.updateUserRequirement(userRequirement.value);
  nextTick(() => {
    adjustTextareaHeight();
  });
});

// Recording and transcription logic

const isRecordingModalOpen = ref(false);
const audioBlob = ref<Blob | null>(null);
const showTranscribeButton = ref(false);

const openRecordingModal = () => {
  isRecordingModalOpen.value = true;
};

const closeRecordingModal = () => {
  isRecordingModalOpen.value = false;
};

const handleRecordingComplete = (blob: Blob) => {
  closeRecordingModal();
  audioBlob.value = blob;
  showTranscribeButton.value = true;
};

const handleTranscribe = async () => {
  if (!audioBlob.value) {
    alert('No audio loaded. Please record first.');
    return;
  }

  await transcribeAudio(audioBlob.value);
};

const transcribeAudio = async (blob: Blob) => {
  // Create a worker
  const worker = new Worker(new URL('@/workers/worker.js', import.meta.url), { type: 'module' });

  worker.onmessage = (event) => {
    const message = event.data;
    if (message.status === 'complete') {
      const transcription = message.data.text;
      // Insert the transcription into the text area
      userRequirement.value += transcription + ' ';
      showTranscribeButton.value = false;
    } else if (message.status === 'error') {
      alert('Error during transcription: ' + message.data.message);
      showTranscribeButton.value = false;
    }
  };

  // Convert blob to array buffer
  const arrayBuffer = await blob.arrayBuffer();
  // Decode audio data
  const audioContext = new AudioContext({ sampleRate: 16000 });
  const audioData = await audioContext.decodeAudioData(arrayBuffer);
  // Prepare audio data
  let audio: Float32Array;
  if (audioData.numberOfChannels === 2) {
    const left = audioData.getChannelData(0);
    const right = audioData.getChannelData(1);
    audio = new Float32Array(left.length);
    for (let i = 0; i < left.length; i++) {
      audio[i] = (left[i] + right[i]) / 2;
    }
  } else {
    audio = audioData.getChannelData(0);
  }
  // Send audio data to worker
  worker.postMessage({
    audio,
    model: 'Xenova/whisper-tiny',
    multilingual: false,
    quantized: false,
    subtask: 'transcribe',
    language: 'english',
  });
};
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
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}
</style>
