<template>
  <Teleport to="body">
    <!-- The outer div is the backdrop. Centering classes are removed as the child now fills the screen. -->
    <div v-if="visible" class="fixed inset-0 bg-black bg-opacity-75 z-50 transition-opacity">
      <!-- Main modal container: Now takes up the entire screen. No rounding or shadow. -->
      <div class="relative bg-white dark:bg-gray-800 w-screen h-screen flex flex-col overflow-hidden">
        <button 
          @click="closeModal" 
          class="absolute top-4 right-4 z-20 p-2 rounded-full bg-gray-100/80 dark:bg-gray-900/80 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all shadow-lg"
          aria-label="Close"
          title="Close"
        >
          <XMarkIcon class="h-6 w-6" />
        </button>
        
        <!-- Iframe Content Wrapper: This layout remains correct for filling the container. -->
        <div class="flex-grow min-h-0 relative">
          <iframe
            v-if="iframeSrc"
            :src="iframeSrc"
            class="absolute inset-0 w-full h-full border-none"
            sandbox="allow-scripts allow-same-origin"
            :title="title"
          ></iframe>
          <div v-else class="w-full h-full flex items-center justify-center text-gray-500">
            Loading content...
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
  iframeSrc: string | null;
  title?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const closeModal = () => {
  emit('close');
};
</script>

<style scoped>
/* Optional: Add transition effects for the modal appearance */
</style>
