<template>
  <div ref="container" class="relative w-full overflow-hidden bg-white" :style="{ height: previewHeight ? previewHeight + 'px' : 'auto' }">
    <!-- Off-screen container for rendering content to capture -->
    <div 
      ref="sourceContainer"
      class="absolute capture-container"
    >
      <!-- Render the ContentViewer off-screen via slot -->
      <slot />
    </div>

    <!-- Preview container to display the snapshot -->
    <div 
      v-if="previewUrl"
      class="w-full bg-center bg-no-repeat"
      :style="{ 
        backgroundImage: `url(${previewUrl})`, 
        backgroundSize: 'contain', 
        height: previewHeight ? previewHeight + 'px' : 'auto' 
      }"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';
import html2canvas from 'html2canvas';
import { useFileExplorerStore } from '~/stores/fileExplorer';

const container = ref<HTMLElement | null>(null);
const sourceContainer = ref<HTMLElement | null>(null);
const previewUrl = ref<string>('');
const previewHeight = ref<number | null>(null);  // Reactive height for the preview container
const fileExplorerStore = useFileExplorerStore();

// Watch for changes in the active file from the store
const activeFile = fileExplorerStore.getActiveFile;

const generatePreview = async () => {
  if (!sourceContainer.value || !container.value) {
    console.error('Source container or main container not defined.');
    return;
  }
  
  try {
    // Capture the off-screen rendered content
    const canvas = await html2canvas(sourceContainer.value, {
      backgroundColor: 'white',
      scale: 2,
      logging: false,
      useCORS: true,
      allowTaint: true,
    });
    
    // Maintain original aspect ratio using container width
    const containerWidth = container.value.offsetWidth;
    const aspectRatio = canvas.height / canvas.width;
    
    const scaledCanvas = document.createElement('canvas');
    const ctx = scaledCanvas.getContext('2d');
    
    scaledCanvas.width = containerWidth;
    scaledCanvas.height = containerWidth * aspectRatio;
    
    // Update the preview height for the container
    previewHeight.value = scaledCanvas.height;
    
    if (ctx) {
      // Apply transformation to correct upside-down image
      ctx.translate(0, scaledCanvas.height);
      ctx.scale(1, -1);
      
      // Draw the captured image onto the scaled canvas
      ctx.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
      previewUrl.value = scaledCanvas.toDataURL('image/png');
    } else {
      console.error('Failed to get canvas context.');
    }
  } catch (error) {
    console.error('Failed to generate preview:', error);
  }
};

onMounted(() => {
  watch(
    () => activeFile.value, // Watch for changes in the active file
    async () => {
      // Wait for the off-screen content to update
      await nextTick();
      await generatePreview();
    },
    { immediate: true }
  );
});
</script>

<style scoped>
.capture-container {
  position: absolute;
  left: -9999px;
  top: -9999px;
  width: 600px; /* Fixed width for consistent capture, adjust as needed */
}
</style>
