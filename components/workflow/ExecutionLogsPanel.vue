<template>
  <div class="mt-5 p-4 border border-gray-300 rounded-md bg-gray-100">
    <h4 class="text-lg font-semibold mb-2">Execution Logs:</h4>
    <pre v-if="logs" class="whitespace-pre-wrap overflow-x-auto text-sm">{{ logs }}</pre>
  </div>
</template>

<script setup lang="ts">
defineProps({
  logs: String
});
</script>