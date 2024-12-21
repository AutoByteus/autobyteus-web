
<template>
  <div 
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="close"
  >
    <div class="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
      <h2 class="text-2xl font-bold mb-4">Conversation History</h2>
      <div v-if="conversationHistoryStore.loading" class="text-center">
        <p>Loading...</p>
      </div>
      <div v-else>
        <ConversationList
          :conversations="conversations"
          :activeConversationId="conversationHistoryStore.stepName"
          @activate="handleActivateConversation"
          @delete="handleDeleteConversation"
        />
        <div class="flex justify-between items-center mt-4">
          <button 
            @click="previousPage" 
            :disabled="conversationHistoryStore.isFirstPage"
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors duration-200 disabled:opacity-50"
          >
            Previous
          </button>
          <span>Page {{ conversationHistoryStore.getCurrentPage }} of {{ conversationHistoryStore.getTotalPages }}</span>
          <button 
            @click="nextPage" 
            :disabled="conversationHistoryStore.isLastPage"
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors duration-200 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
      <div v-if="conversationHistoryStore.error" class="mt-4 text-red-500">
        <p>{{ conversationHistoryStore.error }}</p>
      </div>
      <button 
        @click="close"
        class="mt-6 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors duration-200"
      >
        Close
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useConversationHistoryStore } from '~/stores/conversationHistory';
import { useConversationStore } from '~/stores/conversationStore'; // <-- Import store
import ConversationList from '~/components/conversation/ConversationList.vue';
import type { Conversation } from '~/types/conversation';

const props = defineProps<{
  isOpen: boolean;
  conversations: Conversation[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const conversationHistoryStore = useConversationHistoryStore();
const conversationStore = useConversationStore();

const conversations = computed(() => conversationHistoryStore.getConversations);

const handleActivateConversation = (conversationId: string) => {
  // Directly set conversation from history using the store
  conversationStore.setConversationFromHistory(conversationId);
  // Close panel after activation (optional, but presumably desired)
  close();
};

const handleDeleteConversation = (conversationId: string) => {
  // Depending on how you want to handle "delete from history" or "delete from store"
  // For example, you could do:
  console.log(`Deleting conversation with ID: ${conversationId}`);
  // If you want to remove it from the store:
  conversationStore.removeConversation(conversationId);
  // Optionally refetch the history:
  conversationHistoryStore.fetchConversationHistory();
};

const previousPage = async () => {
  await conversationHistoryStore.previousPage();
};

const nextPage = async () => {
  await conversationHistoryStore.nextPage();
};

const close = () => {
  emit('close');
};
</script>

<style scoped>
/* Add any additional styles here */
/* Ensure messages wrap properly on small screens */
</style>
