
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

// Only process on content changes, not on every render
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
