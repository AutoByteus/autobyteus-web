<template>
  <div>
    <div v-if="message.contextFilePaths && message.contextFilePaths.length > 0">
      <strong>Context Files:</strong>
      <ul class="list-disc list-inside">
        <li v-for="file in message.contextFilePaths" :key="file.path" class="truncate">
          {{ file.path }} ({{ file.type }})
        </li>
      </ul>
    </div>
    <div class="mt-2">
      <strong>User:</strong>
      <!-- Apply CSS to preserve whitespace and line breaks -->
      <div class="whitespace-pre-wrap">{{ message.text }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UserMessage } from '~/types/conversation';

const props = defineProps<{  message: UserMessage;
}>();
</script>

<style scoped>
/* Styles specific to UserMessage, if any, go here */
/* The whitespace-pre-wrap class is provided by Tailwind CSS */
</style>
