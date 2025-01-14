<template>
  <div
    ref="container"
    class="relative w-full overflow-hidden bg-white"
    :style="{ height: previewHeight ? previewHeight + 'px' : 'auto' }"
  >
    <div
      v-if="snapshotUrl"
      class="w-full bg-center bg-no-repeat"
      :style="{
        backgroundImage: `url(${snapshotUrl})`,
        backgroundSize: 'contain',
        height: previewHeight ? previewHeight + 'px' : 'auto'
      }"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{  snapshotUrl: string
}>()

const container = ref<HTMLElement | null>(null)
const previewHeight = ref<number | null>(null)

watch(() => props.snapshotUrl, (newUrl) => {
  if (newUrl && container.value) {
    const img = new Image()
    img.onload = () => {
      if (container.value) {
        const aspectRatio = img.height / img.width
        previewHeight.value = container.value.offsetWidth * aspectRatio
      }
    }
    img.src = newUrl
  }
}, { immediate: true })
</script>

<style scoped>
/* No additional styles needed */
</style>
