<template>
  <div class="think-segment">
    <button @click="toggle" class="think-toggle-button">
      {{ showContent ? 'Hide Thinking Output' : 'Show Thinking Output' }}
    </button>
    <div v-if="showContent" class="think-content">
      <MarkdownRenderer :content="content" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import MarkdownRenderer from '~/components/conversation/segments/renderer/MarkdownRenderer.vue';

const props = defineProps<{  content: string;
}>();

const showContent = ref(false);

const toggle = () => {
  showContent.value = !showContent.value;
};
</script>

<style scoped>
.think-segment {
  margin: 1em 0;
  border: 1px dashed #ccc;
  padding: 0.5em;
}
.think-toggle-button {
  background-color: #f0f0f0;
  border: none;
  padding: 0.5em 1em;
  cursor: pointer;
}
.think-content {
  margin-top: 0.5em;
}
</style>
