<template>
  <div class="flex flex-col h-full">
    <!-- Tabs Header -->
    <div class="flex space-x-1 bg-gray-100 p-1 rounded-t">
      <div
        v-for="conversation in activeConversations"
        :key="conversation.id"
        class="flex items-center"
      >
        <button
          :class="[
            'px-4 py-2 rounded-t text-sm font-medium flex items-center',
            conversation.id === selectedConversationId
              ? 'bg-white text-blue-600'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300',
            conversation.id.startsWith('temp-') && 'italic'
          ]"
          @click="selectConversation(conversation.id)"
        >
          <span>{{ getConversationLabel(conversation) }}</span>
          <span
            class="ml-2 text-gray-500 hover:text-gray-700 cursor-pointer"
            @click.stop="handleCloseConversation(conversation)"
          >
            ×
          </span>
        </button>
      </div>
    </div>
    <!-- Active Conversation Content -->
    <div class="flex-grow overflow-y-auto bg-white">
      <Conversation
        v-if="selectedConversation"
        :conversation="selectedConversation"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useConversationStore } from '~/stores/conversationStore';
import Conversation from './Conversation.vue';

const conversationStore = useConversationStore();

const activeConversations = computed(() => conversationStore.activeConversations);
const selectedConversationId = computed(() => conversationStore.selectedConversationId);
const selectedConversation = computed(() => conversationStore.selectedConversation);

const getConversationLabel = (conversation: any) => {
  if (conversation.id.startsWith('temp-')) {
    return 'New Conversation';
  }
  return `Conversation ${conversation.id.slice(-4)}`;
};

const handleCloseConversation = async (conversation: any) => {
  try {
    await conversationStore.closeConversation(conversation.id);
  } catch (error) {
    console.error('Error closing conversation:', error);
    // Optional: Show error notification to user
  }
};

const selectConversation = (conversationId: string) => {
  conversationStore.setSelectedConversationId(conversationId);
};
</script>

<style scoped>
.conversation-tabs {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
}

.conversation-tabs::-webkit-scrollbar {
  height: 6px;
}

.conversation-tabs::-webkit-scrollbar-track {
  background: transparent;
}

.conversation-tabs::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}
</style>