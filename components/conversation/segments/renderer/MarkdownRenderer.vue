<template>
  <div 
    ref="markdownContainer" 
    v-html="renderedMarkdown" 
    class="markdown-body prose dark:prose-invert prose-gray max-w-none markdown-container"
  ></div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, watch, nextTick, ref } from 'vue';
import { useMarkdown } from '~/composables/useMarkdown';
import { usePlantUML } from '~/composables/usePlantUML';
import highlightService from '~/services/highlightService';
import 'prismjs/themes/prism.css';

const props = defineProps<{  content: string;
}>();

const markdownContainer = ref<HTMLElement | null>(null);
const { renderMarkdown } = useMarkdown();
const { processPlantUmlDiagrams, reset } = usePlantUML();

const renderedMarkdown = computed(() => {
  return renderMarkdown(props.content);
});

// Use a more efficient approach for highlighting code blocks after markdown rendering
const highlightCodeInMarkdown = async () => {
  await nextTick();
  if (markdownContainer.value) {
    // Use the service to highlight code blocks in the container
    highlightService.highlightCodeBlocks(markdownContainer.value);
  }
};

// Optimize PlantUML processing with Intersection Observer
onMounted(() => {
  if (!markdownContainer.value) return;
  
  // Set up Intersection Observer to process diagrams only when visible
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      // Process diagrams and highlight code when visible
      highlightCodeInMarkdown();
      processPlantUmlDiagrams();
    }
  }, {
    rootMargin: '100px 0px', // Process when within 100px of viewport
    threshold: 0
  });
  
  observer.observe(markdownContainer.value);
  
  // Clean up on unmount
  onBeforeUnmount(() => {
    observer.disconnect();
    reset();
  });
});

// Process content changes with debouncing
watch(() => props.content, 
  (newContent, oldContent) => {
    if (newContent !== oldContent) {
      reset();
      
      // Debounce processing to avoid rapid consecutive updates
      const processingTimeout = setTimeout(() => {
        highlightCodeInMarkdown();
        processPlantUmlDiagrams();
      }, 100);
      
      // Clean up timeout on unmount
      onBeforeUnmount(() => {
        clearTimeout(processingTimeout);
      });
    }
  }, 
  { immediate: false }
);
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
