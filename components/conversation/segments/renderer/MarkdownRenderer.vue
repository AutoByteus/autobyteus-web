<template>
  <div v-html="renderedMarkdown" class="markdown-body"></div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useMarkdown } from '~/composables/useMarkdown';
import { usePlantUML } from '~/composables/usePlantUML';

const props = defineProps<{
  content: string;
}>();

const { renderMarkdown } = useMarkdown();
const { processPlantUmlDiagrams } = usePlantUML();

const renderedMarkdown = computed(() => {
  return renderMarkdown(props.content);
});

onMounted(() => {
  processPlantUmlDiagrams();
});
</script>

<style>
.markdown-body {
  font-family: Arial, sans-serif;
  line-height: 1.5;
}

.plantuml-diagram-container {
  @apply my-4 border rounded-lg overflow-hidden bg-gray-50;
}

.plantuml-diagram {
  @apply p-4;
}

.loading-state, .error-state {
  @apply flex flex-col items-center justify-center p-8 text-sm text-gray-600;
}

.diagram-content {
  @apply flex justify-center;
}

.diagram-content img {
  @apply max-w-full h-auto;
}
</style>