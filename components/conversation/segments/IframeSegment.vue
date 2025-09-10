<template>
  <div class="iframe-segment my-4 border rounded-lg shadow-md bg-white dark:bg-gray-800">
    <!-- Header with title and action buttons -->
    <div
      class="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 rounded-t-md border-b border-gray-200 dark:border-gray-600"
    >
      <div 
        @click="toggleExpand" 
        class="flex items-center space-x-2 cursor-pointer flex-grow overflow-hidden"
      >
        <CodeBracketSquareIcon class="h-5 w-5 text-gray-600 dark:text-gray-300 flex-shrink-0" />
        <span class="font-mono text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
          HTML Preview
        </span>
      </div>
      
      <div class="flex items-center space-x-1 flex-shrink-0">
        <!-- Maximize Button -->
        <button
          @click.stop="openModal"
          class="p-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors focus:outline-none"
          title="Maximize"
          v-if="isExpanded"
        >
          <ArrowsPointingOutIcon class="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <!-- Expand/Collapse Button -->
        <button
          @click.stop="toggleExpand"
          class="p-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors focus:outline-none"
          :aria-expanded="isExpanded"
          aria-label="Toggle content"
        >
          <ChevronDownIcon
            class="w-5 h-5 transform transition-transform text-gray-600 dark:text-gray-400"
            :class="{ 'rotate-180': !isExpanded }"
          />
        </button>
      </div>
    </div>

    <!-- Collapsible Iframe Content -->
    <div v-if="isExpanded" class="iframe-container">
      <iframe
        v-if="iframeSrc"
        :src="iframeSrc"
        class="iframe-content"
        sandbox="allow-scripts allow-same-origin"
        title="HTML Preview"
      ></iframe>
      <div v-else class="p-8 text-center text-gray-500">
        Loading content...
      </div>
    </div>
    
    <!-- Full Screen Modal -->
    <FullScreenIframeModal
      :visible="isModalVisible"
      :iframe-src="iframeSrc"
      title="HTML Preview - Full Screen"
      @close="closeModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount, nextTick } from 'vue';
import type { IframeSegment } from '~/utils/aiResponseParser/types';
import { CodeBracketSquareIcon, ChevronDownIcon, ArrowsPointingOutIcon } from '@heroicons/vue/24/outline';
import FullScreenIframeModal from '~/components/common/FullScreenIframeModal.vue';

const props = defineProps<{
  segment: IframeSegment;
}>();

const isExpanded = ref(true); // Default to expanded
const iframeSrc = ref<string | null>(null);
const isModalVisible = ref(false);

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
};

const openModal = () => {
  if (iframeSrc.value) {
    isModalVisible.value = true;
  }
};

const closeModal = () => {
  isModalVisible.value = false;
};

// This watch effect handles the creation and cleanup of the object URL.
// It will run whenever the segment content changes.
watch(() => props.segment.content, (newContent) => {
  // 1. Clean up any previous URL to prevent memory leaks
  if (iframeSrc.value) {
    URL.revokeObjectURL(iframeSrc.value);
    iframeSrc.value = null;
  }

  // Use nextTick to ensure the DOM is ready if we are re-rendering
  nextTick(() => {
    if (newContent) {
      // The origin of a blob URL is unique and opaque. Relative paths for resources
      // (like scripts, styles, or images) inside the iframe's HTML will fail to load
      // as they have no valid base URL. This is the cause of 404 errors
      // and the black screen in the 3D animation (e.g., textures failing to load).
      // To fix this, we inject a <base> tag into the HTML, pointing to our application's
      // origin. This allows relative paths to be resolved correctly.
      const baseUrl = window.location.origin;
      const contentWithBase = `<base href="${baseUrl}/" />\n${newContent}`;

      // 2. Create a new Blob from the modified HTML string
      const blob = new Blob([contentWithBase], { type: 'text/html' });

      // 3. Create the Object URL and assign it to our ref
      iframeSrc.value = URL.createObjectURL(blob);
    }
  });
}, { immediate: true }); // immediate: true runs the watcher once on component mount

// 4. Final cleanup when the component is destroyed
onBeforeUnmount(() => {
  if (iframeSrc.value) {
    URL.revokeObjectURL(iframeSrc.value);
  }
});
</script>

<style scoped>
.iframe-container {
  /* Default aspect ratio for the iframe content */
  aspect-ratio: 16 / 9;
  width: 100%;
  border-top: none;
  overflow: hidden;
}

.iframe-content {
  width: 100%;
  height: 100%;
  border: none;
}
</style>
