<template>
  <div class="overflow-x-auto mb-4">
    <div class="flex justify-between items-center bg-gray-200 p-2 rounded-t-md">
      <span class="font-bold">File: {{ fileSegment.path }}</span>
      <button
        @click="handleApply"
        :disabled="isApplyDisabled"
        :class="[
          'font-bold py-1 px-2 rounded transition-colors duration-200 text-sm',
          isApplyDisabled
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-500 hover:bg-blue-700 text-white'
        ]"
      >
        <span v-if="isInProgress">
          <svg
            class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Applying...
        </span>
        <span v-else-if="isApplied">Applied</span>
        <span v-else>Apply</span>
      </button>
    </div>
    <MarkdownRenderer v-if="isMarkdownFile" :content="fileSegment.originalContent" />
    <pre 
      v-else
      ref="codeContainer"
      :class="'language-' + fileSegment.language + ' w-full overflow-x-auto'"
    ><code v-html="highlightedCode" :class="'language-' + fileSegment.language" data-highlighted="true"></code></pre>
    <div v-if="error" class="mt-2 p-2 rounded bg-red-100 text-red-800">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
import { useFileExplorerStore } from '~/stores/fileExplorer';
import { useWorkspaceStore } from '~/stores/workspace';
import MarkdownRenderer from '~/components/conversation/segments/renderer/MarkdownRenderer.vue';
import { highlightFileSegment } from '~/utils/aiResponseParser/segmentHighlighter';
import highlightService from '~/services/highlightService';
import type { FileSegment } from '~/utils/aiResponseParser/types';

const props = defineProps<{  
  fileSegment: FileSegment;
  conversationId: string;
  messageIndex: number;
}>();

const fileExplorerStore = useFileExplorerStore();
const workspaceStore = useWorkspaceStore();

const codeContainer = ref<HTMLElement | null>(null);
const highlightedCode = ref('');
const isHighlightPending = ref(false);

// Use a more efficient approach to highlight code
const updateHighlightedCode = () => {
  try {
    // Use cached highlightFileSegment function
    const highlighted = highlightFileSegment(props.fileSegment);
    highlightedCode.value = highlighted.highlightedContent || '';
    isHighlightPending.value = false;
  } catch (err) {
    console.error('Failed to highlight code:', err);
    // Fallback to raw content if highlighting fails
    highlightedCode.value = props.fileSegment.originalContent;
    isHighlightPending.value = false;
  }
};

// Use a debounced approach for the watcher to avoid multiple rapid updates
const debouncedHighlight = (() => {
  let timeout: number | null = null;
  return () => {
    if (timeout) {
      clearTimeout(timeout);
    }
    isHighlightPending.value = true;
    timeout = window.setTimeout(() => {
      updateHighlightedCode();
      timeout = null;
    }, 50); // Debounce by 50ms
  };
})();

// Watch for changes in originalContent and debounce highlighting
watch(
  () => props.fileSegment.originalContent,
  () => {
    debouncedHighlight();
  },
  { immediate: true }
);

// Use Intersection Observer to only highlight when visible
onMounted(() => {
  if (!codeContainer.value) return;
  
  // Set up intersection observer to highlight code only when visible
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && isHighlightPending.value) {
      updateHighlightedCode();
    }
  }, { 
    rootMargin: '200px 0px', // Start loading when within 200px of viewport
    threshold: 0 
  });
  
  observer.observe(codeContainer.value);
  
  // Clean up observer when component is unmounted
  onBeforeUnmount(() => {
    observer.disconnect();
  });
});

const isInProgress = computed(() => {
  return fileExplorerStore.isApplyChangeInProgress(
    props.conversationId,
    props.messageIndex,
    props.fileSegment.path
  );
});

const isApplied = computed(() => {
  return fileExplorerStore.isChangeApplied(
    props.conversationId,
    props.messageIndex,
    props.fileSegment.path
  );
});

const isApplyDisabled = computed(() => {
  return isInProgress.value || isApplied.value;
});

const error = computed(() => {
  return fileExplorerStore.getApplyChangeError(
    props.conversationId,
    props.messageIndex,
    props.fileSegment.path
  );
});

const handleApply = async () => {
  try {
    await fileExplorerStore.writeFileContent(
      workspaceStore.currentSelectedWorkspaceId,
      props.fileSegment.path,
      props.fileSegment.originalContent,
      props.conversationId,
      props.messageIndex
    );
  } catch (err) {
    console.error('Failed to apply file change:', err);
  }
};

const isMarkdownFile = computed(() => {
  return props.fileSegment.path.endsWith('.md');
});
</script>

<style scoped>
/* Additional styles for markdown elements */
</style>
