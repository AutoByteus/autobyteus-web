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
  <!-- Display total tokens and total cost at the bottom of the conversation -->
  <div
    v-if="totalUsage.totalTokens > 0"
    class="text-xs text-blue-700 font-medium mt-2 text-right"
  >
    Total: {{ totalUsage.totalTokens }} tokens / ${{ totalUsage.totalCost.toFixed(4) }}
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Conversation, Message } from '~/types/conversation';
import UserMessage from '~/components/conversation/UserMessage.vue';
import AIMessage from '~/components/conversation/AIMessage.vue';

const props = defineProps<{  conversation: Conversation;
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

/**
 * Computes the total tokens and total cost for the entire conversation.
 */
const totalUsage = computed(() => {
  let totalTokens = 0;
  let totalCost = 0;
  props.conversation.messages.forEach((message) => {
    if (message.type === 'user') {
      if (message.promptTokens) {
        totalTokens += message.promptTokens;
      }
      if (message.promptCost) {
        totalCost += message.promptCost;
      }
    } else if (message.type === 'ai') {
      if (message.completionTokens) {
        totalTokens += message.completionTokens;
      }
      if (message.completionCost) {
        totalCost += message.completionCost;
      }
    }
  });
  return { totalTokens, totalCost };
});
</script>

<style scoped>
/* Ensure messages wrap properly on small screens */
</style>
