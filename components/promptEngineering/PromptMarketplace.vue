<template>
  <div class="prompt-marketplace">
    <div v-if="loading" class="grid place-items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
    </div>

    <div v-else-if="error" class="text-red-500 text-center py-8">
      {{ error }}
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="prompt in prompts"
        :key="prompt.id"
        class="prompt-card bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-200"
        :class="{ 'border-blue-500': selectedPromptId === prompt.id }"
        @click="$emit('select-prompt', prompt.id)"
      >
        <div class="p-6">
          <div class="flex items-start justify-between">
            <h3 class="text-lg font-medium text-gray-900">{{ prompt.name }}</h3>
            <span class="px-2 py-1 text-sm rounded-full bg-gray-100 text-gray-600">
              {{ prompt.category }}
            </span>
          </div>

          <p class="mt-1 text-xs text-gray-500">Version: v{{ prompt.version }}</p>

          <p class="mt-2 text-sm text-gray-500 line-clamp-3">{{ prompt.promptContent }}</p>

          <div class="mt-4 flex flex-wrap gap-2 text-xs text-gray-500">
            <span>Description: {{ prompt.description || '—' }}</span>
            <span>Models: {{ prompt.suitableForModels || '—' }}</span>
          </div>

          <div class="mt-4 text-sm text-gray-500">
            <span>Created {{ formatDate(prompt.createdAt) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { usePromptStore } from '~/stores/promptStore';

const props = defineProps<{ selectedPromptId: string | null }>();
defineEmits<{ (e: 'select-prompt', id: string): void }>();

const promptStore = usePromptStore();
const { prompts, loading, error } = storeToRefs(promptStore);

onMounted(async () => {
  try {
    await promptStore.fetchActivePrompts();
  } catch (err) {
    console.error('Failed to fetch prompts:', err);
  }
});

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
</script>

<style scoped>
.prompt-card {
  cursor: pointer;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
