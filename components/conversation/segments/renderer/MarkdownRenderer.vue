<template>
  <div v-html="renderedMarkdown" class="markdown-body"></div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import MarkdownIt from 'markdown-it';
import markdownItPlantuml from '~/utils/markdownItPlantuml';
import { plantumlService } from '~/services/plantumlService';

const props = defineProps<{
  content: string;
}>();

const renderedMarkdown = computed(() => {
  const md = new MarkdownIt({
    html: true,
  });
  md.use(markdownItPlantuml);
  return md.render(props.content);
});

const processPlantUmlDiagrams = async () => {
  const diagrams = document.querySelectorAll('.plantuml-diagram');
  for (const diagram of diagrams) {
    const content = decodeURIComponent(diagram.getAttribute('data-content') || '');
    const loadingState = diagram.querySelector('.loading-state');
    const errorState = diagram.querySelector('.error-state');
    const diagramContent = diagram.querySelector('.diagram-content');

    if (!loadingState || !errorState || !diagramContent) continue;

    try {
      loadingState.style.display = 'flex';
      errorState.style.display = 'none';
      diagramContent.style.display = 'none';

      const imageBlob = await plantumlService.generateDiagram(content);
      const imageUrl = URL.createObjectURL(imageBlob);

      const img = new Image();
      img.onload = () => {
        loadingState.style.display = 'none';
        diagramContent.style.display = 'block';
      };
      img.onerror = () => {
        loadingState.style.display = 'none';
        errorState.style.display = 'flex';
      };
      img.src = imageUrl;
      img.alt = 'PlantUML diagram';
      img.className = 'max-w-full';
      
      diagramContent.innerHTML = '';
      diagramContent.appendChild(img);
    } catch (error) {
      console.error('Failed to process PlantUML diagram:', error);
      loadingState.style.display = 'none';
      errorState.style.display = 'flex';
    }
  }
};

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