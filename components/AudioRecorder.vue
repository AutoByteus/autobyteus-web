<template>
  <div class="flex flex-col justify-center items-center">
    <audio v-if="recordedBlobUrl" :src="recordedBlobUrl" controls class="mt-4"></audio>
    
    <!-- Show transcription results only when not recording and transcription exists -->
    <div v-if="!recording && transcriptionStore.isTranscribing" class="mt-4">
      <p class="text-gray-600">Transcribing audio...</p>
    </div>
    <div v-if="!recording && transcriptionStore.error" class="mt-4 p-4 bg-red-50 text-red-600 rounded-md">
      {{ transcriptionStore.error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';
import { useTranscriptionStore } from '~/stores/transcriptionStore';

const props = defineProps({
  recording: {
    type: Boolean,
    required: true,
  },
  onRecordingComplete: {
    type: Function,
    required: true,
  },
});

const transcriptionStore = useTranscriptionStore();
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
  // Reset all states before starting new recording
  recordedBlob.value = null;
  recordedBlobUrl.value = null;
  transcriptionStore.$reset(); // Reset transcription store

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
      
      // Start transcription only after recording is complete
      await transcriptionStore.transcribeAudio(blob);
      
      // Stop all tracks to release the microphone
      stream.getTracks().forEach(track => track.stop());
    });
    mediaRecorder.value.start();

    // Optional: Emit an event or handle timer if needed
  } catch (error) {
    console.error('Error accessing microphone:', error);
  }
};

const stopRecording = () => {
  if (mediaRecorder.value && mediaRecorder.value.state === 'recording') {
    mediaRecorder.value.stop();
  }
};

// Watch for changes in the recording prop to start or stop recording
watch(() => props.recording, (newRecording) => {
  if (newRecording) {
    startRecording();
  } else {
    stopRecording();
  }
});

// Cleanup on component unmount
onUnmounted(() => {
  if (mediaRecorder.value && mediaRecorder.value.state === 'recording') {
    mediaRecorder.value.stop();
  }
});
</script>

<style scoped>
audio {
  width: 100%;
}
</style>