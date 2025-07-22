<template>
  <div class="markdown-renderer-segments">
    <template v-for="segment in segments" :key="segment.key">
      <div v-if="segment.type === 'html'" v-html="segment.content" class="markdown-body prose dark:prose-invert prose-gray max-w-none"></div>
      <PlantUMLDiagram
        v-else-if="segment.type === 'plantuml'"
        :content="segment.content"
        :diagram-id="segment.diagramId"
        class="plantuml-segment-container"
      />
      <!-- For regular code blocks, they are now part of 'html' segments, pre-rendered by MarkdownIt with PrismJS highlighting -->
      <!-- If specific handling for 'code' segments was needed (e.g. for a CodeBlock.vue component),
           useMarkdownSegments would need to differentiate them more clearly from general HTML.
           The current useMarkdownSegments turns non-PlantUML fences into HTML via mdWithPrism.
      -->
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useMarkdownSegments, type MarkdownSegment } from '~/composables/useMarkdownSegments';
import PlantUMLDiagram from './PlantUMLDiagram.vue'; // Adjusted path if necessary
// highlightService might still be needed if PrismJS classes are not self-sufficient or for other elements
import highlightService from '~/services/highlightService'; 
// Import PrismJS theme if not globally imported or handled by markdownItPrism/Nuxt config
import 'prismjs/themes/prism.css'; // Or your theme, e.g., prism-okaidia.css

const props = defineProps<{  content: string;
}>();

const contentRef = computed(() => props.content);
const { parsedSegments } = useMarkdownSegments(contentRef);

// For Vue 3, `segments` will be a Ref<MarkdownSegment[]>
const segments = computed(() => parsedSegments.value);

// If highlightService is still needed for code blocks rendered as HTML by markdownItPrism
// (e.g. for copy buttons or other enhancements not done by Prism plugin itself)
// It should operate on the whole container after segments are rendered.
const markdownRendererContainer = ref<HTMLElement | null>(null); // If needed to scope highlightService

const applyPostRenderEffects = async () => {
    await nextTick();
    // Example: if highlightService needs to find .highlight elements or something similar.
    // This part needs to be re-evaluated based on how PrismJS is now integrated via useMarkdownSegments.
    // If markdownItPrism directly adds all necessary classes and no JS is needed, this might be empty.
    // For now, assuming highlightService.highlightCodeBlocks could enhance Prism's output (e.g., line numbers, copy button init)
    // This is a placeholder; actual Prism integration might make this call obsolete or different.
    // if (markdownRendererContainer.value) {
    //    highlightService.highlightCodeBlocks(markdownRendererContainer.value);
    // }
};

onMounted(applyPostRenderEffects);
watch(segments, applyPostRenderEffects, { deep: true }); // Re-apply if segments change

</script>

<style>
/* Styles for .markdown-body, prose, etc., should be defined globally or in a parent component if they apply here.
   This component now renders segments, so the .markdown-body class is applied to HTML segments.
*/
.markdown-renderer-segments .markdown-body pre[class*="language-"] {
  margin: 1em 0;
  padding: 1em;
  overflow: auto;
  /* Background handled by Prism theme or .prose */
}

.markdown-renderer-segments .markdown-body code[class*="language-"] {
  white-space: pre;
  word-break: normal;
  word-wrap: normal;
  font-family: 'Fira Code', monospace;
  font-size: 14px;
  line-height: 1.5;
}

/* Container for PlantUML diagram if specific margin/padding is needed around it */
.plantuml-segment-container {
  margin: 1em 0; /* Example margin, similar to <pre> blocks */
}

/* Ensure prose styles apply correctly within the v-html parts */
.markdown-renderer-segments .prose {
  /* Standard prose styles will apply here */
}
.dark .markdown-renderer-segments .dark\:prose-invert {
 /* Dark mode prose styles */
}

</style>
