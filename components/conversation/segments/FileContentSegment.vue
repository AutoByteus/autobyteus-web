<template>
  <div class="overflow-x-auto mb-4">
    <!-- Header with file name and Apply / Reapply button -->
    <div class="flex justify-between items-center bg-gray-200 p-2 rounded-t-md">
      <div class="flex items-center">
        <!-- expand / collapse button -->
        <button
          @click="toggleExpand"
          class="mr-2 p-1 rounded hover:bg-gray-300 transition-colors focus:outline-none"
          :aria-expanded="isExpanded"
          aria-label="Toggle file content"
        >
          <svg
            class="w-4 h-4 transform transition-transform"
            :class="{ 'rotate-90': isExpanded }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
        <span class="font-bold">File: {{ fileSegment.path }}</span>
      </div>

      <!-- Apply / Reapply button -->
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
        <span v-if="isInProgress" class="flex items-center">
          <!-- loader -->
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
            />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Applying…
        </span>
        <span v-else-if="applyCount > 0">Reapply ({{ applyCount }})</span>
        <span v-else>Apply</span>
      </button>
    </div>

    <!-- Collapsed content preview -->
    <div
      v-if="!isExpanded"
      class="p-2 bg-amber-50 border border-amber-100 rounded-b-md cursor-pointer hover:bg-amber-100 transition-colors"
      @click="toggleExpand"
    >
      <div class="preview-content">
        <code class="text-sm font-mono">{{ contentPreview }}</code>
      </div>
    </div>

    <!-- Full content when expanded -->
    <div v-else>
      <MarkdownRenderer v-if="isMarkdownFile" :content="fileSegment.originalContent" />
      <pre
        v-else
        ref="codeContainer"
        :class="'language-' + fileSegment.language + ' w-full overflow-x-auto'"
      ><code
        v-html="highlightedCode"
        :class="'language-' + fileSegment.language"
        data-highlighted="true"
      ></code></pre>
    </div>

    <!-- error -->
    <div v-if="error" class="mt-2 p-2 rounded bg-red-100 text-red-800">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount, nextTick, watchEffect } from 'vue';
import { useFileExplorerStore } from '~/stores/fileExplorer';
import { useWorkspaceStore } from '~/stores/workspace';
import MarkdownRenderer from '~/components/conversation/segments/renderer/MarkdownRenderer.vue';
import { highlightFileSegment } from '~/utils/aiResponseParser/segmentHighlighter';
import type { FileSegment } from '~/utils/aiResponseParser/types';

/* -------------------------------------------------------------------------- */
/* Props & Stores                                                             */
/* -------------------------------------------------------------------------- */

const props = defineProps<{  fileSegment: FileSegment;
  conversationId: string;
  messageIndex: number;
}>();

const fileExplorerStore = useFileExplorerStore();
const workspaceStore    = useWorkspaceStore();

/* -------------------------------------------------------------------------- */
/* State                                                                      */
/* -------------------------------------------------------------------------- */

const codeContainer       = ref<HTMLElement | null>(null);
const highlightedCode     = ref('');
const isHighlightPending  = ref(false);
const isExpanded          = ref(false);
const applyCount          = ref(0);               // <— NEW: keeps track of how many times user applied

/* -------------------------------------------------------------------------- */
/* Derived State                                                              */
/* -------------------------------------------------------------------------- */

const contentPreview = computed(() => {
  const lines = props.fileSegment.originalContent.split('\n');
  const preview = lines.slice(0, 5).join('\n');
  return lines.length > 5 ? preview + '\n...' : preview;
});

const isInProgress = computed(() =>
  fileExplorerStore.isApplyChangeInProgress(
    props.conversationId,
    props.messageIndex,
    props.fileSegment.path
  )
);

/* we only block clicks while an async write is running */
const isApplyDisabled = computed(() => isInProgress.value);

const error = computed(() =>
  fileExplorerStore.getApplyChangeError(
    props.conversationId,
    props.messageIndex,
    props.fileSegment.path
  )
);

const isMarkdownFile = computed(() => props.fileSegment.path.endsWith('.md'));

/* -------------------------------------------------------------------------- */
/* Initialise applyCount if this file had already been applied previously     */
/* -------------------------------------------------------------------------- */
watchEffect(() => {
  const wasAppliedEarlier = fileExplorerStore.isChangeApplied(
    props.conversationId,
    props.messageIndex,
    props.fileSegment.path
  );
  if (wasAppliedEarlier && applyCount.value === 0) {
    applyCount.value = 1;    // assume at least once
  }
});

/* -------------------------------------------------------------------------- */
/* Expand / collapse logic                                                    */
/* -------------------------------------------------------------------------- */

function toggleExpand() {
  isExpanded.value = !isExpanded.value;
  if (isExpanded.value && isHighlightPending.value) updateHighlightedCode();
}

/* -------------------------------------------------------------------------- */
/* Syntax-highlight once visible & debounced                                  */
/* -------------------------------------------------------------------------- */

function updateHighlightedCode() {
  try {
    highlightedCode.value = highlightFileSegment(props.fileSegment).highlightedContent || '';
  } catch (err) {
    console.error('Failed to highlight:', err);
    highlightedCode.value = props.fileSegment.originalContent;
  } finally {
    isHighlightPending.value = false;
  }
}

const debouncedHighlight = (() => {
  let t: number | null = null;
  return () => {
    if (t) clearTimeout(t);
    isHighlightPending.value = true;
    t = window.setTimeout(() => {
      if (isExpanded.value) updateHighlightedCode();
      t = null;
    }, 50);
  };
})();

watch(
  () => props.fileSegment.originalContent,
  () => debouncedHighlight(),
  { immediate: true }
);

onMounted(() => {
  if (!codeContainer.value) return;
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && isExpanded.value && isHighlightPending.value) {
        updateHighlightedCode();
      }
    },
    { rootMargin: '200px 0px' }
  );
  observer.observe(codeContainer.value!);
  onBeforeUnmount(() => observer.disconnect());
});

/* -------------------------------------------------------------------------- */
/* Apply / Reapply handler                                                    */
/* -------------------------------------------------------------------------- */

async function handleApply() {
  try {
    const workspaceId = workspaceStore.activeWorkspace?.workspaceId;
    if (!workspaceId) {
      throw new Error("No active workspace selected. Cannot apply file changes.");
    }

    await fileExplorerStore.writeFileContent(
      workspaceId,
      props.fileSegment.path,
      props.fileSegment.originalContent,
      props.conversationId,
      props.messageIndex
    );
    applyCount.value += 1;          // <— increment counter when successful
  } catch (err) {
    console.error('Failed to apply change:', err);
  }
}
</script>

<style scoped>
.preview-content {
  max-height: 7.5em;               /* ≈5 lines */
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  line-height: 1.5;
}
</style>
