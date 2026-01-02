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
        <Icon icon="heroicons:code-bracket-square" class="h-5 w-5 text-gray-600 dark:text-gray-300 flex-shrink-0" />
        <span class="font-mono text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
          {{ headerTitle }}
        </span>
      </div>
      
      <div class="flex items-center space-x-2 flex-shrink-0">
        <!-- Copy Button -->
        <CopyButton v-if="segment.isComplete" :text-to-copy="segment.content" />
        <!-- View Mode Toggle Button -->
        <button
          v-if="segment.isComplete"
          @click.stop="toggleViewMode"
          class="p-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors focus:outline-none"
          :title="viewMode === 'preview' ? 'View Source' : 'View Preview'"
        >
          <Icon v-if="viewMode === 'source'" icon="heroicons:eye" class="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <Icon v-else icon="heroicons:code-bracket" class="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <!-- Maximize Button -->
        <button
          @click.stop="openModal"
          class="p-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors focus:outline-none"
          title="Maximize"
          v-if="isExpanded && segment.isComplete && viewMode === 'preview'"
        >
          <Icon icon="heroicons:arrows-pointing-out" class="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <!-- Expand/Collapse Button -->
        <button
          @click.stop="toggleExpand"
          class="p-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors focus:outline-none"
          :aria-expanded="isExpanded"
          aria-label="Toggle content"
        >
          <Icon icon="heroicons:chevron-down"
            class="w-5 h-5 transform transition-transform text-gray-600 dark:text-gray-400"
            :class="{ 'rotate-180': !isExpanded }"
          />
        </button>
      </div>
    </div>

    <!-- Collapsible Content Area -->
    <div v-if="isExpanded">
      <!-- RENDER AS CODE WHILE STREAMING -->
      <div v-if="!segment.isComplete">
        <FileDisplay path="preview.html" :content="segment.content" />
      </div>

      <!-- RENDER AS IFRAME OR SOURCE CODE ONCE COMPLETE -->
      <div v-else>
        <!-- Preview Mode -->
        <div v-if="viewMode === 'preview'" class="iframe-container">
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
        <!-- Source Code Mode -->
        <div v-else>
          <FileDisplay path="preview.html" :content="segment.content" />
        </div>
      </div>
    </div>
    
    <!-- Full Screen Modal -->
    <FullScreenIframeModal
      v-if="segment.isComplete"
      :visible="isModalVisible"
      :iframe-src="iframeSrc"
      title="HTML Preview - Full Screen"
      @close="closeModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount, nextTick, computed } from 'vue';
import type { IframeSegment } from '~/types/segments';
import { Icon } from '@iconify/vue';
import FullScreenIframeModal from '~/components/common/FullScreenIframeModal.vue';
import FileDisplay from '~/components/conversation/segments/renderer/FileDisplay.vue';
import CopyButton from '~/components/common/CopyButton.vue';

const props = defineProps<{
  segment: IframeSegment;
}>();

const isExpanded = ref(true);
const iframeSrc = ref<string | null>(null);
const isModalVisible = ref(false);
const viewMode = ref<'preview' | 'source'>('preview');

const headerTitle = computed(() => {
  if (!props.segment.isComplete) {
    return 'HTML Code (Streaming...)';
  }
  return viewMode.value === 'preview' ? 'HTML Preview' : 'HTML Source Code';
});

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
};

const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'preview' ? 'source' : 'preview';
};

const openModal = () => {
  if (iframeSrc.value && props.segment.isComplete && viewMode.value === 'preview') {
    isModalVisible.value = true;
  }
};

const closeModal = () => {
  isModalVisible.value = false;
};

// This watch effect handles the creation and cleanup of the object URL *only when the content is complete*.
watch(() => [props.segment.content, props.segment.isComplete], ([newContent, isComplete]) => {
  // 1. Clean up any previous URL to prevent memory leaks
  if (iframeSrc.value) {
    URL.revokeObjectURL(iframeSrc.value);
    iframeSrc.value = null;
  }

  // Only proceed to create a blob URL if the segment is marked as complete.
  if (isComplete) {
    viewMode.value = 'preview'; // Default to preview mode on completion
    nextTick(() => {
      if (newContent) {
        const baseUrl = window.location.origin;
        const contentWithBase = `<base href="${baseUrl}/" />\n${newContent}`;
        const blob = new Blob([contentWithBase], { type: 'text/html' });
        iframeSrc.value = URL.createObjectURL(blob);
      }
    });
  }
}, { immediate: true });

// Final cleanup when the component is destroyed
onBeforeUnmount(() => {
  if (iframeSrc.value) {
    URL.revokeObjectURL(iframeSrc.value);
  }
});
</script>

<style scoped>
.iframe-container {
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
