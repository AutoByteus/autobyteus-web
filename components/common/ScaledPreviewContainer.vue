<template>
  <!-- 
    The outer container is sized by the parent (e.g., 320x180).
    We measure the rendered child content in the <div ref="contentContainer"> 
    and apply a scale transform so that the entire content fits.
  -->
  <div ref="container" class="relative w-full h-full overflow-hidden bg-white">
    <!-- We wrap the slot in a container that we can measure -->
    <div 
      ref="contentContainer"
      class="absolute top-0 left-0"
      :style="contentStyles"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';

const container = ref<HTMLElement | null>(null);
const contentContainer = ref<HTMLElement | null>(null);

// We'll store the current scale in a reactive ref
const scaleValue = ref(1);

// We keep track of the content's width/height
const contentWidth = ref<number>(0);
const contentHeight = ref<number>(0);

const containerWidth = ref<number>(0);
const containerHeight = ref<number>(0);

const contentStyles = computed(() => {
  // We scale the entire content while anchoring at the top-left corner
  return {
    transformOrigin: 'top left',
    transform: `scale(${scaleValue.value})`
  };
});

// A function to measure the container and content, then compute the scale
const measureAndScale = () => {
  if (!container.value || !contentContainer.value) return;

  const containerRect = container.value.getBoundingClientRect();
  const contentRect = contentContainer.value.getBoundingClientRect();

  containerWidth.value = containerRect.width;
  containerHeight.value = containerRect.height;

  // If contentRect is 0x0 before it truly renders, we can do nextTick or watchers.
  contentWidth.value = contentRect.width;
  contentHeight.value = contentRect.height;

  // Only scale if content is non-zero in size
  if (contentWidth.value > 0 && contentHeight.value > 0) {
    const widthRatio = containerWidth.value / contentWidth.value;
    const heightRatio = containerHeight.value / contentHeight.value;
    // We choose the smaller ratio so we don't distort the aspect ratio
    scaleValue.value = Math.min(widthRatio, heightRatio);
  } else {
    scaleValue.value = 1;
  }
};

// Re-measure whenever the size might change
// A more robust solution could use a ResizeObserver or watchers. For a simpler approach here, we rely on mount + nextTick.
onMounted(() => {
  // measure once on mount
  nextTick(measureAndScale);
});

// Optionally watch for changes in containerRect or contentRect if those can change frequently. 
// For an advanced approach, use a ResizeObserver on container.value and contentContainer.value.

</script>

<style scoped>
/* 
  We make sure we have a fully relative container, 
  so the absolutely-positioned child is measured properly.
*/
.relative {
  position: relative;
}
.absolute {
  position: absolute;
}
</style>
