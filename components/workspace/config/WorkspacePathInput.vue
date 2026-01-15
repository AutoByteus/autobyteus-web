<template>
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-1">Workspace Directory</label>
    
    <div class="flex gap-3">
      <!-- Input Field -->
      <div class="relative flex-grow">
        <input
          type="text"
          v-model="tempPath"
          @keydown.enter="handleLoad"
          :disabled="isLoading || disabled"
          class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500 py-2.5 px-3"
          :class="{ 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500': error }"
          placeholder="/absolute/path/to/workspace"
        />
      </div>

      <!-- Load Button -->
      <button
        type="button"
        @click="handleLoad"
        :disabled="isLoading || disabled || !tempPath.trim() || tempPath === modelValue"
        class="inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed min-w-[80px]"
      >
        <span v-if="isLoading" class="i-heroicons-arrow-path-20-solid h-4 w-4 animate-spin"></span>
        <span v-else>Load</span>
      </button>
    </div>
    
    <!-- Helper Text Area -->
    <div class="mt-2 min-h-[1.5em]">
      <p v-if="error" class="text-sm text-red-600 flex items-center">
        <span class="i-heroicons-exclamation-circle-20-solid h-5 w-5 mr-2 flex-shrink-0"></span>
        {{ error }}
      </p>
      
      <p v-else-if="isLoaded && modelValue === tempPath" class="text-sm text-green-600 flex items-center font-medium">
        <span class="i-heroicons-check-circle-20-solid h-5 w-5 mr-2 flex-shrink-0 text-green-500"></span>
        Workspace loaded successfully
      </p>
      
      <p v-else class="text-sm text-gray-500 flex items-center">
        Enter path to load workspace.
        <span class="i-heroicons-information-circle-20-solid h-4 w-4 ml-1.5 text-gray-400 cursor-help" title="Path must be an absolute file system path"></span>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  modelValue: string;
  isLoading: boolean;
  error: string | null;
  isLoaded: boolean;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

// Local state for the input field
const tempPath = ref(props.modelValue);

// Sync local state when prop changes (e.g. initial load or parent update)
watch(() => props.modelValue, (newValue) => {
  tempPath.value = newValue;
});

const handleLoad = () => {
  if (props.isLoading || props.disabled || !tempPath.value.trim()) return;
  emit('update:modelValue', tempPath.value);
};
</script>
