<template>
  <div class="image-viewer-container">
    <img v-if="url" :src="url" alt="Image content" class="image-content" />
    <div v-else class="error-placeholder">
      <p>Image URL is not available.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  url: string | null;
}>();
</script>

<style scoped>
.image-viewer-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  padding: 1rem;
  background-color: #f9fafb; /* gray-50 */
  overflow: auto;
}

.image-content {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}

.error-placeholder {
  color: #6b7280; /* gray-500 */
}
</style>
