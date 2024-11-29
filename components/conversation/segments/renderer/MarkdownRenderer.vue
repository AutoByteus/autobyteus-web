<template>
  <div v-html="renderedMarkdown" class="markdown-body prose dark:prose-invert prose-gray max-w-none"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import MarkdownIt from 'markdown-it';

const props = defineProps<{
  content: string;
}>();

const md = new MarkdownIt({
  html: true,
  breaks: true,
  linkify: true,
  typographer: true
});

const renderedMarkdown = computed(() => {
  return md.render(props.content);
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

/* Add specific markdown overrides if needed */
.markdown-body {
  @apply text-base leading-relaxed;
}

.markdown-body ul {
  @apply list-disc list-inside my-4;
}

.markdown-body ol {
  @apply list-decimal list-inside my-4;
}

.markdown-body li {
  @apply my-1;
}
</style>