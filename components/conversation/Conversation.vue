<template>
  <div class="space-y-4 mb-4">
    <div class="cost-display bg-gray-100 p-2 rounded text-gray-700">
        Total Cost: ${{ (totalCost || 0).toFixed(6) }}
    </div>
    <div v-if="conversation">
      <div class="cost-display bg-gray-100 p-2 rounded text-gray-700">
          Conversation Cost: ${{ (totalCost || 0).toFixed(6) }}
      </div>
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
        <span class="text-xs text-gray-500 absolute bottom-1 right-2">
          {{ formatTimestamp(message.timestamp) }}
        </span>
        <!-- Display cost per message -->
        <div class="text-xs text-gray-500 absolute top-1 right-2">
            Cost: ${{ (message.cost || 0).toFixed(6) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Conversation } from '~/types/conversation';
import UserMessage from '~/components/conversation/UserMessage.vue';
import AIMessage from '~/components/conversation/AIMessage.vue';

const props = defineProps<{
  conversation: Conversation;
}>();

const conversationStore = useConversationStore();
const conversation = computed(() => conversationStore.selectedConversation);
const totalCost = computed(() => conversationStore.selectedConversation?.totalCost || 0);

const conversationId = computed(() => props.conversation.id);

const formatTimestamp = (date: string) => {
  const parsedDate = new Date(date);
  return parsedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
</script>

<style scoped>
.cost-display {
  text-align: center;
  font-weight: bold;
}
</style>