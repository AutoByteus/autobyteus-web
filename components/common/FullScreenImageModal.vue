<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
    @click.self="closeModalAndReset"
    @keydown.esc="closeModalAndReset"
    @keydown.left.prevent="emit('previous')"
    @keydown.right.prevent="emit('next')"
    tabindex="0"
    ref="modalContainer"
  >
    <!-- Modal Box: Added min-h-[75vh] to make it utilize more screen height -->
    <div 
      class="relative bg-white dark:bg-zinc-800 p-4 rounded-lg shadow-xl 
             w-full max-w-[95vw] h-full max-h-[95vh] min-h-[75vh] 
             flex flex-col"
    >
      <!-- Close Button -->
      <button
        @click="closeModalAndReset"
        aria-label="Close"
        class="absolute -top-3 -right-3 text-white bg-zinc-700 hover:bg-zinc-900 dark:bg-zinc-900 dark:hover:bg-zinc-700 rounded-full p-2 z-20"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" class="w-5 h-5 fill-current">
          <path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/>
        </svg>
      </button>

      <!-- Image container for zooming and scrolling -->
      <div 
        class="overflow-auto flex-grow relative select-none" 
        ref="imageScrollContainer"
        @wheel="handleWheelZoom"
      >
        <img 
          v-if="imageUrl"
          :src="imageUrl" 
          :alt="altText" 
          class="object-contain mx-auto my-auto transition-transform duration-75 ease-out"
          :style="{ transform: `scale(${currentScale})`, transformOrigin: 'top left', cursor: isDragging ? 'grabbing' : 'grab' }"
          ref="zoomableImage"
          draggable="false"
          @mousedown="startDrag"
          @mousemove="drag"
          @mouseup="endDrag"
          @mouseleave="endDrag"
        />
        <div v-else class="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
          No image to display.
        </div>
      </div>

      <!-- Controls: Download and Reset Zoom -->
      <div v-if="imageUrl" class="mt-3 flex justify-center items-center space-x-3 flex-shrink-0">
         <button
            @click="handleDownload"
            class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
        >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="w-4 h-4 fill-current inline-block mr-2 -mt-1"><path d="M288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32V274.7l-73.4-73.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l128 128c12.5 12.5 32.8 12.5 45.3 0l128-128c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L288 274.7V32zM64 352c-17.7 0-32 14.3-32 32v64c0 17.7 14.3 32 32 32H448c17.7 0 32-14.3 32-32V384c0-17.7-14.3-32-32-32H64z"/></svg>
            Download
        </button>
        <button
            v-if="currentScale !== 1 || imageScrollContainer && (imageScrollContainer.scrollLeft !== 0 || imageScrollContainer.scrollTop !== 0)"
            @click="resetImageState"
            title="Reset View"
            class="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 rounded-md transition-colors"
        >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline-block mr-1 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 10L3 3m0 7v-7h7" /></svg>
            Reset View <span v-if="currentScale !==1">({{ Math.round(currentScale * 100) }}%)</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps<{
  visible: boolean;
  imageUrl: string | null;
  altText?: string;
  downloadFilename?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'next'): void;
  (e: 'previous'): void;
}>();

const modalContainer = ref<HTMLElement | null>(null);
const imageScrollContainer = ref<HTMLElement | null>(null); 
const zoomableImage = ref<HTMLImageElement | null>(null); 

const currentScale = ref(1);
const MIN_SCALE = 0.1;
const MAX_SCALE = 10;
const ZOOM_SENSITIVITY = 0.1;

const isDragging = ref(false);
const lastDragPosition = ref<{ x: number; y: number } | null>(null);

const resetImageState = () => {
  currentScale.value = 1;
  if (imageScrollContainer.value) {
    imageScrollContainer.value.scrollLeft = 0;
    imageScrollContainer.value.scrollTop = 0;
  }
};

const closeModalAndReset = () => {
  emit('close');
};

const handleDownload = () => {
  if (props.imageUrl) {
    const a = document.createElement('a');
    a.href = props.imageUrl;
    a.download = props.downloadFilename || 'diagram.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
};

const handleWheelZoom = (event: WheelEvent) => {
  if (!props.imageUrl || !imageScrollContainer.value || !zoomableImage.value) return;
  event.preventDefault();

  const container = imageScrollContainer.value;
  const rect = container.getBoundingClientRect();

  const mouseXInContainer = event.clientX - rect.left;
  const mouseYInContainer = event.clientY - rect.top;

  const pointX = (container.scrollLeft + mouseXInContainer) / currentScale.value;
  const pointY = (container.scrollTop + mouseYInContainer) / currentScale.value;
  
  const delta = event.deltaY > 0 ? -ZOOM_SENSITIVITY : ZOOM_SENSITIVITY;
  let newScale = currentScale.value * (1 + delta); 
  newScale = Math.max(MIN_SCALE, Math.min(newScale, MAX_SCALE));

  const newScrollLeft = pointX * newScale - mouseXInContainer;
  const newScrollTop = pointY * newScale - mouseYInContainer;

  currentScale.value = newScale;

  nextTick(() => {
    if (imageScrollContainer.value) { 
        imageScrollContainer.value.scrollLeft = newScrollLeft;
        imageScrollContainer.value.scrollTop = newScrollTop;
    }
  });
};

const startDrag = (event: MouseEvent) => {
  if (!imageScrollContainer.value) return;
  if (event.button !== 0) return;

  isDragging.value = true;
  lastDragPosition.value = { x: event.clientX, y: event.clientY };
  
  window.addEventListener('mousemove', drag);
  window.addEventListener('mouseup', endDrag);
};

const drag = (event: MouseEvent) => {
  if (!isDragging.value || !lastDragPosition.value || !imageScrollContainer.value) return;
  event.preventDefault(); 

  const dx = event.clientX - lastDragPosition.value.x;
  const dy = event.clientY - lastDragPosition.value.y;

  imageScrollContainer.value.scrollLeft -= dx;
  imageScrollContainer.value.scrollTop -= dy;

  lastDragPosition.value = { x: event.clientX, y: event.clientY };
};

const endDrag = () => {
  if (!isDragging.value) return;

  isDragging.value = false;
  lastDragPosition.value = null;
  
  window.removeEventListener('mousemove', drag);
  window.removeEventListener('mouseup', endDrag);
};

watch(() => props.visible, async (isVisible) => {
  if (isVisible) {
    await nextTick(); 
    modalContainer.value?.focus(); 
    resetImageState(); 
  } else {
    resetImageState(); 
    if(isDragging.value) endDrag();
  }
});

watch(() => props.imageUrl, () => {
    resetImageState();
});

onMounted(() => {
  if (props.visible) {
     modalContainer.value?.focus();
     resetImageState();
  }
});

onBeforeUnmount(() => {
    window.removeEventListener('mousemove', drag);
    window.removeEventListener('mouseup', endDrag);
});

</script>

<style scoped>
[tabindex="0"]:focus {
  outline: none;
}
.object-contain {
  max-width: 100%;
  max-height: 100%;
}
.select-none {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}
img {
  -webkit-user-drag: none;
  -khtml-user-drag: none;
  -moz-user-drag: none;
  -o-user-drag: none;
  user-drag: none;
}
</style>
