<template>
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 transition-opacity" @click.self="closeModal">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-[95vw] h-[95vh] flex flex-col overflow-hidden">
        <!-- Modal Header -->
        <div class="flex justify-between items-center p-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h3 class="text-base font-semibold text-gray-800 dark:text-gray-200">{{ title }}</h3>
          <button @click="closeModal" class="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            <XMarkIcon class="h-5 w-5" />
          </button>
        </div>
        
        <!-- Iframe Content -->
        <div class="flex-grow">
          <iframe
            v-if="iframeSrc"
            :src="iframeSrc"
            class="w-full h-full border-none"
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
