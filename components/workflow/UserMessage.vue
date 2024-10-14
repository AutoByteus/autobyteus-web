<!-- File: autobyteus-web/components/workflow/UserMessage.vue -->
<!-- This component renders a user message -->

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
      <div>{{ message.text }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UserMessage } from '~/types/conversation';

defineProps<{
  message: UserMessage;
}>();
</script>