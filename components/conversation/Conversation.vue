<!-- File: autobyteus-web/components/conversation/Conversation.vue -->
<!-- This component renders a conversation between a user and an AI -->

<template>
  <div class="space-y-4 mb-4">
    <div
      v-for="(message, index) in conversation.messages"
      :key="message.timestamp + '-' + message.type + '-' + index"
      :class="[
        'p-3 rounded-lg max-w-full relative shadow-sm hover:shadow-md transition-shadow duration-200 break-words',
        message.type === 'user' ? 'ml-auto bg-blue-100 text-blue-800' : 'mr-auto bg-gray-100 text-gray-800'
      ]"
    >
      <UserMessage
        v-if="message.type === 'user'"
        :message="message"
      />
      <AIMessage
        v-else
        :message="message"
        :conversation-id="conversation.id"
        :message-index="index"
      />
      <span class="text-xs text-gray-500 absolute bottom-1 right-2">
        {{ formatTimestamp(message.timestamp) }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Conversation } from '~/types/conversation';
import UserMessage from '~/components/conversation/UserMessage.vue';
import AIMessage from '~/components/conversation/AIMessage.vue';

const props = defineProps<{
  conversation: Conversation;
}>();

// Format the timestamp for display
const formatTimestamp = (date: Date) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
</script>

<style scoped>
/* Add any additional styles here */
/* Ensure messages wrap properly on small screens */
</style>