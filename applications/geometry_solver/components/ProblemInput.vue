<template>
  <div class="p-6 h-full flex flex-col">
    <h2 class="text-xl font-semibold text-gray-800 mb-4">Geometry Problem</h2>
    <textarea
      v-model="problemText"
      class="w-full flex-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none"
      placeholder="Enter your geometry problem here. For example: 'Find the area of a triangle with a base of 10 units and a height of 5 units.'"
    ></textarea>
    <button
      @click="handleSubmit"
      :disabled="isLoading || !problemText.trim()"
      class="mt-4 w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
    >
      <svg v-if="isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span>{{ isLoading ? 'Processing...' : 'Solve & Animate' }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  isLoading: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit', problemText: string): void;
}>();

const problemText = ref('');

function handleSubmit() {
  if (problemText.value.trim()) {
    emit('submit', problemText.value.trim());
  }
}
</script>
