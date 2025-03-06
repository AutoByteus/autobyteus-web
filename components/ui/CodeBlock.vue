<template>
  <div class="code-block-container">
    <div v-if="showHeader" class="code-header">
      <span v-if="filename" class="filename">{{ filename }}</span>
      <span v-if="language" class="language-badge">{{ language }}</span>
    </div>
    <pre :class="`language-${languageClass}`"><code v-html="highlightedCode" data-highlighted="true"></code></pre>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import highlightService from '~/services/highlightService';

const props = defineProps({
  code: {
    type: String,
    required: true
  },
  language: {
    type: String,
    default: 'plaintext'
  },
  filename: {
    type: String,
    default: ''
  },
  showHeader: {
    type: Boolean,
    default: false
  }
});

const languageClass = computed(() => props.language.toLowerCase());

const highlightedCode = computed(() => {
  return highlightService.highlight(props.code, props.language);
});
</script>

<style scoped>
.code-block-container {
  margin: 1em 0;
  border-radius: 0.375rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  background-color: #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.875rem;
}

.filename {
  font-family: 'Fira Code', monospace;
  color: #374151;
}

.language-badge {
  background-color: #e5e7eb;
  color: #4b5563;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  text-transform: uppercase;
}

pre {
  margin: 0;
  padding: 1rem;
  overflow-x: auto;
}

:deep(code) {
  font-family: 'Fira Code', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
}

/* Dark mode */
:global(.dark) .code-header {
  background-color: #1f2937;
  border-color: #374151;
}

:global(.dark) .filename {
  color: #e5e7eb;
}

:global(.dark) .language-badge {
  background-color: #374151;
  color: #d1d5db;
}
</style>
