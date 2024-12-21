
<template>
  <div v-html="renderedMarkdown" class="markdown-body prose dark:prose-invert prose-gray max-w-none markdown-container"></div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { useMarkdown } from '~/composables/useMarkdown';
import { usePlantUML } from '~/composables/usePlantUML';
import 'prismjs/themes/prism.css';

const props = defineProps<{
  content: string;
}>();

const { renderMarkdown } = useMarkdown();
const { processPlantUmlDiagrams, reset } = usePlantUML();

const renderedMarkdown = computed(() => {
  return renderMarkdown(props.content);
});

// Process PlantUML diagrams after markdown rendering
watch(() => props.content, async (newContent, oldContent) => {
  if (newContent !== oldContent) {
    reset();
    await nextTick();
    await processPlantUmlDiagrams();
  }
}, { immediate: true });

onBeforeUnmount(() => {
  reset();
});
</script>

<style>
.markdown-container {
  /* Existing styles */
  pre[class*="language-"] {
    margin: 1em 0;
    padding: 1em;
    overflow: auto;
    background-color: rgb(243 244 246);
  }

  /* Dark mode support */
  .dark & pre[class*="language-"] {
    background-color: rgb(31 41 55);
  }

  /* Code block styling */
  code[class*="language-"] {
    white-space: pre;
    word-break: normal;
    word-wrap: normal;
    font-family: 'Fira Code', monospace;
    font-size: 14px;
    line-height: 1.5;
  }
}
</style>
