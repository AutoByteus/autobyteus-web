<template>
  <div class="plantuml-diagram-component group relative my-4" @mouseenter="isHovering = true" @mouseleave="isHovering = false">
    <div v-if="isLoading" class="loading-state p-6 border border-dashed border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-800 flex flex-col items-center justify-center min-h-[100px]">
      <svg class="animate-spin h-8 w-8 text-gray-500 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span class="mt-3 text-sm text-gray-600 dark:text-gray-300">Generating diagram...</span>
    </div>

    <div v-else-if="error" class="error-state p-6 border border-dashed border-red-400 dark:border-red-600 rounded bg-red-50 dark:bg-gray-800 flex flex-col items-center justify-center min-h-[100px]">
      <svg class="h-8 w-8 text-red-500 dark:text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
      </svg>
      <span class="mt-3 text-sm text-red-600 dark:text-red-400 text-center" style="white-space: pre-wrap;">{{ error }}</span>
    </div>

    <div v-else-if="imageUrl" class="diagram-content relative">
      <img :src="imageUrl" :alt="`PlantUML Diagram ${uniqueDiagramId}`" class="max-w-full block mx-auto" />
      <div 
        v-show="isHovering" 
        class="diagram-controls absolute top-2 right-2 z-10 flex space-x-2 transition-opacity duration-200 opacity-100"
      >
        <button @click="openModal" title="Maximize" class="p-1.5 bg-gray-800 bg-opacity-60 text-white rounded hover:bg-opacity-80 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="w-4 h-4 fill-current"><path d="M32 32C14.3 32 0 46.3 0 64v96c0 17.7 14.3 32 32 32s32-14.3 32-32V96h64c17.7 0 32-14.3 32-32s-14.3-32-32-32H32zM64 352c-17.7 0-32 14.3-32 32s14.3 32 32 32h64v64c0 17.7 14.3 32 32 32s32-14.3 32-32V384c0-17.7-14.3-32-32-32H64zM320 32c-17.7 0-32 14.3-32 32v64h64c17.7 0 32-14.3 32-32s-14.3-32-32-32H320zM384 352c-17.7 0-32 14.3-32 32v64h-64c-17.7 0-32 14.3-32 32s14.3 32 32 32h96c17.7 0 32-14.3 32-32V384c0-17.7-14.3-32-32-32z"/></svg>
        </button>
        <button @click="downloadImage" title="Download" class="p-1.5 bg-gray-800 bg-opacity-60 text-white rounded hover:bg-opacity-80 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="w-4 h-4 fill-current"><path d="M288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32V274.7l-73.4-73.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l128 128c12.5 12.5 32.8 12.5 45.3 0l128-128c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L288 274.7V32zM64 352c-17.7 0-32 14.3-32 32v64c0 17.7 14.3 32 32 32H448c17.7 0 32-14.3 32-32V384c0-17.7-14.3-32-32-32H64z"/></svg>
        </button>
      </div>
    </div>
    
    <FullScreenImageModal
      v-if="imageUrl"
      :visible="isModalVisible"
      :image-url="imageUrl"
      :alt-text="`Maximized PlantUML Diagram ${uniqueDiagramId}`"
      :download-filename="`plantuml-diagram-${uniqueDiagramId}.png`"
      @close="isModalVisible = false"
      @download="downloadImage"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
import { plantumlService } from '~/services/plantumlService';
import { plantUMLSuccessCache, plantUMLErrorCache, generateDiagramId as calculateDiagramId } from '~/utils/plantUMLCache';
import FullScreenImageModal from '~/components/common/FullScreenImageModal.vue';

const props = defineProps<{  content: string;
  diagramId?: string; // Optional, will be generated if not provided
}>();

const uniqueDiagramId = computed(() => props.diagramId || calculateDiagramId(props.content));

const isLoading = ref(true);
const imageUrl = ref<string | null>(null);
const error = ref<string | null>(null);
const isHovering = ref(false);
const isModalVisible = ref(false);

let currentBlobUrl: string | null = null;

const loadDiagram = async () => {
  isLoading.value = true;
  error.value = null;
  if (currentBlobUrl) {
    URL.revokeObjectURL(currentBlobUrl);
    currentBlobUrl = null;
  }
  imageUrl.value = null;

  const id = uniqueDiagramId.value;

  if (plantUMLErrorCache.has(id)) {
    error.value = plantUMLErrorCache.get(id)!;
    isLoading.value = false;
    return;
  }

  if (plantUMLSuccessCache.has(id)) {
    imageUrl.value = plantUMLSuccessCache.get(id)!;
    isLoading.value = false;
    return;
  }

  try {
    const blob = await plantumlService.generateDiagram(props.content);
    const newBlobUrl = URL.createObjectURL(blob);
    currentBlobUrl = newBlobUrl; // Store for potential cleanup
    imageUrl.value = newBlobUrl;
    plantUMLSuccessCache.set(id, newBlobUrl);
  } catch (err: any) {
    const errorMessage = err.message || 'Failed to generate diagram.'; 
    error.value = errorMessage;
    plantUMLErrorCache.set(id, errorMessage);
  } finally {
    isLoading.value = false;
  }
};

const openModal = () => {
  if (imageUrl.value) {
    isModalVisible.value = true;
  }
};

const downloadImage = () => {
  if (imageUrl.value) {
    const a = document.createElement('a');
    a.href = imageUrl.value;
    a.download = `plantuml-diagram-${uniqueDiagramId.value}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
};

onMounted(() => {
  loadDiagram();
});

watch(() => props.content, () => {
  loadDiagram();
});

onBeforeUnmount(() => {
  if (currentBlobUrl) {
    if (plantUMLSuccessCache.get(uniqueDiagramId.value) === currentBlobUrl && currentBlobUrl.startsWith('blob:')) {
         URL.revokeObjectURL(currentBlobUrl);
    }
    currentBlobUrl = null;
  }
});
</script>

<style scoped>
.plantuml-diagram-component {
  /* Add any specific styling for the wrapper if needed */
}
.min-h-\[100px\] { /* Ensure loading/error states have some height */
  min-height: 100px;
}
/* Scoped styles specific to PlantUMLDiagram.vue */
.diagram-controls button {
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
</style>
