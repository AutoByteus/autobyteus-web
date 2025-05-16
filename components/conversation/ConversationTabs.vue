<template>
  <div class="flex flex-col h-full">
    <!-- Tabs Header -->
    <div class="tabs-container">
      <div class="flex space-x-1 bg-gray-100 p-1 rounded-t conversation-tabs whitespace-nowrap">
        <div
          v-for="conversation in allOpenConversations"
          :key="conversation.id"
          class="flex items-center"
        >
          <button
            :class="[
              'px-4 py-2 rounded-t text-sm font-medium flex items-center',
              conversation.id === currentSelectedConversationId
                ? 'bg-white text-blue-600'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300',
              conversation.id.startsWith('temp-') && 'italic'
            ]"
            @click="handleSelectConversation(conversation.id)"
            :title="getConversationLabel(conversation)"
          >
            <span class="truncate max-w-[200px]">{{ getConversationLabel(conversation) }}</span>
            <span
              class="ml-2 text-gray-500 hover:text-gray-700 cursor-pointer"
              @click.stop="handleCloseConv(conversation)"
            >
              ×
            </span>
          </button>
        </div>
      </div>
    </div>
    <!-- Active Conversation Content -->
    <div class="flex-grow overflow-y-auto bg-white">
      <Conversation
        v-if="currentSelectedConversation"
        :conversation="currentSelectedConversation"
      />
      <div v-else class="p-4 text-center text-gray-500">
        Select a conversation or start a new one.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useConversationStore } from '~/stores/conversationStore';
import Conversation from './Conversation.vue';
import { useWorkflowStore } from '~/stores/workflow';
import type { Conversation as ConversationType } from '~/types/conversation';

const conversationStore = useConversationStore();
const workflowStore = useWorkflowStore();

const allOpenConversations = computed(() => conversationStore.allOpenConversations);
const currentSelectedConversationId = computed(() => conversationStore.selectedConversationId);
const currentSelectedConversation = computed(() => conversationStore.selectedConversation);

const getConversationLabel = (conversation: ConversationType) => {
  const stepName = workflowStore.getStepNameById(conversation.stepId);
  if (conversation.id.startsWith('temp-')) {
    return `New - ${stepName}`;
  }
  // Truncate ID for display, e.g. last 4 chars
  const idSuffix = conversation.id.slice(-4).toUpperCase();
  return `${stepName} - ${idSuffix}`;
};

const handleCloseConv = async (conversation: ConversationType) => {
  try {
    await conversationStore.closeConversation(conversation.id);
  } catch (error) {
    console.error('Error closing conversation:', error);
    // Optional: Show error notification to user
  }
};

const handleSelectConversation = (conversationId: string) => {
  conversationStore.setSelectedConversationId(conversationId);
  // Watcher in WorkflowStepView will sync workflowStore.currentSelectedStepId
};
</script>

<style scoped>
.tabs-container {
  position: relative;
  overflow-x: auto;
  overflow-y: hidden;
  width: 100%;
}

.conversation-tabs {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
}

.conversation-tabs::-webkit-scrollbar {
  height: 6px;
  width: 6px;
}

.conversation-tabs::-webkit-scrollbar-track {
  background: transparent;
}

.conversation-tabs::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}

.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
