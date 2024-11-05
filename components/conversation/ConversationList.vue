<template>
  <div class="mb-4">
    <ul class="space-y-2">
      <li 
        v-for="conversation in conversations" 
        :key="conversation.id"
        :class="[
          'border border-gray-200 rounded-md p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-200',
          conversation.id === activeConversationId ? 'bg-gray-100' : ''
        ]"
        @click="activateConversation(conversation.id)"
      >
        <div>
          <span class="text-sm font-medium">
            {{ formatTimestamp(conversation.createdAt) }}
          </span>
          <p class="text-sm text-gray-700 truncate">
            {{ conversationPreview(conversation.messages[0]?.text || 'No messages') }}
          </p>
        </div>
        <button 
          @click.stop="deleteConversation(conversation.id)"
          class="text-red-500 hover:text-red-700"
          title="Delete conversation"
        >
          <i class="fas fa-trash-alt"></i>
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import type { Conversation } from '~/types/conversation';

const props = defineProps<{
  conversations: Conversation[];
  activeConversationId: string | null;
}>();

const emit = defineEmits<{
  (e: 'activate', conversationId: string): void;
  (e: 'delete', conversationId: string): void;
}>();

const formatTimestamp = (date: string) => {
  const parsedDate = new Date(date);
  return parsedDate.toLocaleString([], { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

const conversationPreview = (message: string) => {
  return `${message.slice(0, 100)}${message.length > 100 ? '...' : ''}`;
};

const activateConversation = (conversationId: string) => {
  emit('activate', conversationId);
};

const deleteConversation = (conversationId: string) => {
  emit('delete', conversationId);
};
</script>

<style scoped>
/* Add any additional styles here */
/* Ensure messages wrap properly on small screens */
</style>