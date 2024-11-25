<template>
  <div 
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="close"
  >
    <div class="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
      <h2 class="text-2xl font-bold mb-4">Conversation History</h2>
      
        <!-- Add time frame selector -->
        <div class="mb-4">
          <label for="timeFrame" class="block text-sm font-medium text-gray-700">Select Time Frame:</label>
          <select
            id="timeFrame"
            v-model="selectedTimeFrame"
            @change="onTimeFrameChange"
            class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>
  
        <!-- Display total cost -->
        <div class="mb-4">
          <p class="text-lg font-semibold">Total Cost: ${{ totalCost.toFixed(2) }}</p>
        </div>
        
      <div v-if="conversationHistoryStore.loading" class="text-center">
        <p>Loading...</p>
      </div>
      <div v-else>
        <ConversationList
          :conversations="conversations"
          :activeConversationId="conversationHistoryStore.stepName"
          @activate="activateConversation"
          @delete="deleteConversation"
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
import ConversationList from '~/components/conversation/ConversationList.vue';
import type { Conversation } from '~/types/conversation';

const props = defineProps<{
  isOpen: boolean;
  conversations: Conversation[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'activate', conversationId: string): void;
}>();
const conversationHistoryStore = useConversationHistoryStore();

const conversations = computed(() => conversationHistoryStore.getConversations);
  
  // Add ref for selectedTimeFrame
  const selectedTimeFrame = ref('week');
  
  const totalCost = computed(() => conversationHistoryStore.totalCost);

const activateConversation = (conversationId: string) => {
  emit('activate', conversationId);
};

const deleteConversation = (conversationId: string) => {
  // Implement deletion logic if necessary
  console.warn(`Delete conversation with ID: ${conversationId}`);
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
  
  // Fetch total cost when time frame changes
  const onTimeFrameChange = async () => {
    await conversationHistoryStore.fetchTotalCost(selectedTimeFrame.value);
  };
</script>

<style scoped>
/* Add any additional styles here */
/* Ensure messages wrap properly on small screens */
</style>