<template>
  <div v-html="renderedMarkdown" class="markdown-body prose dark:prose-invert prose-gray max-w-none"></div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { useMarkdown } from '~/composables/useMarkdown';
import { usePlantUML } from '~/composables/usePlantUML';

const props = defineProps<{
  content: string;
}>();

const { renderMarkdown } = useMarkdown();
const { processPlantUmlDiagrams, reset } = usePlantUML();

const renderedMarkdown = computed(() => {
  return renderMarkdown(props.content);
});

// Watch for content changes to reprocess diagrams
watch(() => props.content, () => {
  // Reset previous state
  reset();
  // Process new diagrams after the next DOM update
  nextTick(() => {
    processPlantUmlDiagrams();
  });
});

onMounted(() => {
  processPlantUmlDiagrams();
});

onBeforeUnmount(() => {
  reset();
});
</script>

<style>
/* Keep PlantUML specific styles */
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

/* Updated markdown list styles */
.markdown-body {
  @apply text-base leading-relaxed;
}

.markdown-body ul {
  @apply list-disc list-outside pl-8 my-4;
}

.markdown-body ol {
  @apply list-decimal list-outside pl-8 my-4;
}

.markdown-body li {
  @apply my-1;
}

.markdown-body li > p {
  @apply inline;
}
</style>