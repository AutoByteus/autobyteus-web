<template>
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" @click.self="closeModal">
      <!-- Modal Box -->
      <div class="relative bg-black rounded-lg shadow-xl w-full max-w-4xl h-auto max-h-[90vh] flex flex-col">
        <!-- Close Button -->
        <button
          @click="closeModal"
          aria-label="Close"
          class="absolute -top-3 -right-3 text-white bg-zinc-800 hover:bg-zinc-900 rounded-full p-2 z-20"
        >
          <XMarkIcon class="w-5 h-5" />
        </button>
        
        <!-- Video Player -->
        <div class="flex-grow flex items-center justify-center overflow-hidden">
          <video
            v-if="videoUrl"
            :src="videoUrl"
            controls
            autoplay
            class="w-full h-auto max-h-[85vh] object-contain"
          >
            Your browser does not support the video tag.
          </video>
          <div v-else class="text-gray-400">
            No video to display.
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { XMarkIcon } from '@heroicons/vue/24/solid';

defineProps<{
  visible: boolean;
  videoUrl: string | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const closeModal = () => {
  emit('close');
};
</script>

<style scoped>
/* Optional: Add transition effects */
.fixed {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
