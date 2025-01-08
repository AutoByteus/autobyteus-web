
<!-- This component renders a conversation between a user and an AI, displaying token usage/cost instead of timestamps. -->

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
        :conversation-id="conversationId"
        :message-index="index"
      />

      <span class="text-xs text-blue-700 font-medium absolute bottom-1 right-2">
        {{ formatTokenCost(message) }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Conversation, Message } from '~/types/conversation';
import UserMessage from '~/components/conversation/UserMessage.vue';
import AIMessage from '~/components/conversation/AIMessage.vue';

const props = defineProps<{
  conversation: Conversation;
}>();

const conversationId = computed(() => props.conversation.id);

const formatTokenCost = (message: Message) => {
  if (message.type === 'user') {
    const userMsg = message;
    if (userMsg.promptTokens != null && userMsg.promptCost != null) {
      return `${userMsg.promptTokens} tokens / $${userMsg.promptCost.toFixed(4)}`;
    }
    return '';
  } else if (message.type === 'ai') {
    const aiMsg = message;
    if (aiMsg.completionTokens != null && aiMsg.completionCost != null) {
      return `${aiMsg.completionTokens} tokens / $${aiMsg.completionCost.toFixed(4)}`;
    }
    return '';
  }
  return '';
};
</script>

<style scoped>
/* Ensure messages wrap properly on small screens */
</style>
