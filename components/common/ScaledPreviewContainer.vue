<template>
  <div
    ref="container"
    class="relative w-full overflow-hidden bg-white"
    :style="{ height: previewHeight ? previewHeight + 'px' : 'auto' }"
  >
    <!-- Preview container to display the snapshot -->
    <div
      v-if="previewUrl"
      class="w-full bg-center bg-no-repeat"
      :style="{
        backgroundImage: 'url(' + previewUrl + ')',
        backgroundSize: 'contain',
        height: previewHeight ? previewHeight + 'px' : 'auto'
      }"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import html2canvas from 'html2canvas';

// Reactive references for the container and snapshot data
const container = ref<HTMLElement | null>(null);
const previewUrl = ref<string>('');
const previewHeight = ref<number | null>(null);

/**
 * Captures a snapshot from a given HTML element and displays it in this container.
 * @param element The DOM element to capture.
 */
const captureSnapshot = async (element: HTMLElement) => {
  if (!container.value) {
    console.error('ScaledPreviewContainer: Main container is not defined.');
    return;
  }

  try {
    // Capture the on-screen content
    const canvas = await html2canvas(element, {
      backgroundColor: 'white',
      scale: 2,
      logging: false,
      useCORS: true,
      allowTaint: true,
    });

    // Calculate scaled dimensions based on the container’s width
    const containerWidth = container.value.offsetWidth;
    const aspectRatio = canvas.height / canvas.width;

    const scaledCanvas = document.createElement('canvas');
    const ctx = scaledCanvas.getContext('2d');

    scaledCanvas.width = containerWidth;
    scaledCanvas.height = containerWidth * aspectRatio;
    previewHeight.value = scaledCanvas.height;

    if (ctx) {
      // Flip the y-axis to correct any rendering issues (if needed)
      ctx.translate(0, scaledCanvas.height);
      ctx.scale(1, -1);
      ctx.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);

      // Convert to data URL for display
      previewUrl.value = scaledCanvas.toDataURL('image/png');
    } else {
      console.error('ScaledPreviewContainer: Failed to get 2D context.');
    }
  } catch (error) {
    console.error('ScaledPreviewContainer: Failed to capture snapshot:', error);
  }
};

defineExpose({
  captureSnapshot
});
</script>

<style scoped>
/* No off-screen container needed since we only capture when content is on-screen */
</style>
