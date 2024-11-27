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
    try {
      const imageBlob = await plantumlService.generateDiagram(content);
      const imageUrl = URL.createObjectURL(imageBlob);
      diagram.innerHTML = `<img src="${imageUrl}" alt="PlantUML diagram" />`;
    } catch (error) {
      console.error('Failed to process PlantUML diagram:', error);
      diagram.innerHTML = '<p class="error">Failed to load diagram</p>';
    }
  }
};

onMounted(() => {
  processPlantUmlDiagrams();
});
</script>

<style scoped>
.markdown-body {
  font-family: Arial, sans-serif;
  line-height: 1.5;
}

/* Additional styles for markdown elements */
</style>