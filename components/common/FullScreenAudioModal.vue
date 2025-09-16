<template>
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" @click.self="closeModal">
      <!-- Modal Box -->
      <div class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md flex flex-col p-6">
        <!-- Close Button -->
        <button
          @click="closeModal"
          aria-label="Close"
          class="absolute top-2 right-2 p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <XMarkIcon class="w-5 h-5" />
        </button>
        
        <!-- Header -->
        <div class="flex items-center mb-4">
          <MusicalNoteIcon class="w-8 h-8 text-indigo-500 mr-3" />
          <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">Audio Player</h3>
        </div>

        <!-- Audio Player -->
        <div class="flex-grow">
          <audio
            v-if="audioUrl"
            :src="audioUrl"
            controls
            autoplay
            class="w-full"
          >
            Your browser does not support the audio element.
          </audio>
          <div v-else class="text-gray-500 dark:text-gray-400 text-center py-4">
            No audio to display.
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { XMarkIcon, MusicalNoteIcon } from '@heroicons/vue/24/solid';

defineProps<{
  visible: boolean;
  audioUrl: string | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const closeModal = () => {
  emit('close');
};
</script>

<style scoped>
.fixed {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
