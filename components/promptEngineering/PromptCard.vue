<template>
  <div 
    class="prompt-card bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-200 group relative"
    :class="{ 'border-blue-500': isSelected }"
  >
    <!-- Hover delete button -->
    <button 
      v-if="showDeleteButton"
      @click.stop="$emit('delete', prompt.id)"
      class="absolute top-2 right-2 p-2 rounded-full bg-white shadow opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-50 text-red-600"
      title="Delete prompt"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>

    <div 
      class="p-6 cursor-pointer" 
      @click="$emit('select', prompt.id)"
    >
      <!-- Card Header -->
      <div class="flex items-start gap-2 mb-3">
        <h3 class="text-lg font-medium text-gray-900 flex-grow truncate">{{ prompt.name }}</h3>
        <span class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600 whitespace-nowrap">
          v{{ prompt.version }}
        </span>
      </div>

      <!-- Card Body -->
      <div class="mb-3">
        <p v-if="prompt.description" class="text-sm text-gray-700 line-clamp-2 mb-2">
          {{ prompt.description }}
        </p>
        <div class="bg-gray-50 rounded p-3 mt-2">
          <p class="text-sm text-gray-600 font-mono line-clamp-3">{{ prompt.promptContent }}</p>
        </div>
      </div>
      
      <!-- Card Footer with Enhanced Model Display -->
      <div class="mt-3">
        <!-- Model compatibility badges -->
        <div v-if="prompt.suitableForModels" class="mb-2 flex flex-wrap gap-1">
          <ModelBadge
            v-for="model in modelList"
            :key="model"
            :model="model"
            size="small"
          />
        </div>
        
        <!-- Date info -->
        <div class="flex justify-between items-center text-xs text-gray-500">
          <span>{{ formatDate(prompt.createdAt) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import ModelBadge from '~/components/promptEngineering/ModelBadge.vue';

interface Prompt {
  id: string;
  name: string;
  category: string;
  promptContent: string;
  description?: string | null;
  suitableForModels?: string | null;
  version: number;
  createdAt: string;
  parentPromptId?: string | null;
}

const props = defineProps<{  prompt: Prompt;
  isSelected: boolean;
  showDeleteButton?: boolean;
}>();

const emit = defineEmits<{  (e: 'select', id: string): void;
  (e: 'delete', id: string): void;
}>();

// Parse models into a list for display
const modelList = computed(() => {
  if (!props.prompt.suitableForModels) return [];
  return props.prompt.suitableForModels.split(',').map(model => model.trim());
});

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
