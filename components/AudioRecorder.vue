<template>
  <div class="flex flex-col justify-center items-center">
    <button
      type="button"
      @click="handleToggleRecording"
      :class="[
        'm-2 inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white focus:outline-none transition-all duration-200',
        recording ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600',
      ]"
    >
      {{ recording ? `Stop Recording (${formatAudioTimestamp(duration)})` : 'Start Recording' }}
    </button>
    <audio v-if="recordedBlobUrl" :src="recordedBlobUrl" controls class="mt-4"></audio>
    
    <!-- Transcription Results -->
    <div v-if="transcriptionStore.isTranscribing" class="mt-4">
      <p class="text-gray-600">Transcribing audio...</p>
    </div>
    <div v-else-if="transcriptionStore.transcription" class="mt-4 p-4 bg-gray-50 rounded-md">
      <p class="text-gray-800">{{ transcriptionStore.transcription }}</p>
    </div>
    <div v-if="transcriptionStore.error" class="mt-4 p-4 bg-red-50 text-red-600 rounded-md">
      {{ transcriptionStore.error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import { formatAudioTimestamp } from '~/utils/AudioUtils';
import { useTranscriptionStore } from '~/stores/transcriptionStore';

const props = defineProps({
  onRecordingComplete: {
    type: Function,
    required: true,
  },
});

const transcriptionStore = useTranscriptionStore();
const recording = ref(false);
const duration = ref(0);
const recordedBlob = ref<Blob | null>(null);
const recordedBlobUrl = ref<string | null>(null);
const mediaRecorder = ref<MediaRecorder | null>(null);
const chunks = ref<Blob[]>([]);
let timer: number | null = null;

const getMimeType = () => {
  const types = [
    'audio/webm;codecs=opus',
    'audio/ogg;codecs=opus',
    'audio/wav',
  ];
  for (let i = 0; i < types.length; i++) {
    if (MediaRecorder.isTypeSupported(types[i])) {
      return types[i];
    }
  }
  return '';
};

const startRecording = async () => {
  recordedBlob.value = null;
  recordedBlobUrl.value = null;
  duration.value = 0;
  transcriptionStore.$reset();

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = getMimeType();
    mediaRecorder.value = new MediaRecorder(stream, { mimeType });
    mediaRecorder.value.addEventListener('dataavailable', (event) => {
      if (event.data.size > 0) {
        chunks.value.push(event.data);
      }
    });
    mediaRecorder.value.addEventListener('stop', async () => {
      const blob = new Blob(chunks.value, { type: mimeType });
      recordedBlob.value = blob;
      recordedBlobUrl.value = URL.createObjectURL(blob);
      chunks.value = [];
      props.onRecordingComplete(blob);
      
      // Start transcription
      await transcriptionStore.transcribeAudio(blob);
    });
    mediaRecorder.value.start();
    recording.value = true;

    timer = window.setInterval(() => {
      duration.value += 1;
    }, 1000);
  } catch (error) {
    console.error('Error accessing microphone:', error);
  }
};

const stopRecording = () => {
  if (mediaRecorder.value && mediaRecorder.value.state === 'recording') {
    mediaRecorder.value.stop();
    recording.value = false;
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  }
};

const handleToggleRecording = () => {
  if (recording.value) {
    stopRecording();
  } else {
    startRecording();
  }
};

onUnmounted(() => {
  if (recording.value) {
    stopRecording();
  }
});
</script>