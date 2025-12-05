<template>
  <!-- Removed h-[800px], overflow-hidden, flex-col to match ServerSettingsManager behavior -->
  <div class="conversation-history-manager bg-white rounded-lg shadow-lg">
    
    <!-- View Switcher -->
    <HistoryList v-if="!store.selectedConversationId" />
    <HistoryDetail 
      v-else 
      @notify="showNotification"
    />

    <!-- Toast Notification -->
    <div 
      v-if="notification"
      class="fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all duration-300 transform translate-y-0 z-50 flex items-center gap-2"
      :class="notification.type === 'success' ? 'bg-gray-900 text-white' : 'bg-red-600 text-white'"
    >
      <span v-if="notification.type === 'success'" class="i-heroicons-check-circle-20-solid w-5 h-5 text-green-400"></span>
      <span v-else class="i-heroicons-exclamation-circle-20-solid w-5 h-5"></span>
      {{ notification.message }}
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRawConversationHistoryStore } from '~/stores/rawConversationHistory';
import HistoryList from './conversationHistory/HistoryList.vue';
import HistoryDetail from './conversationHistory/HistoryDetail.vue';

const store = useRawConversationHistoryStore();
const notification = ref<{message: string, type: 'success' | 'error'} | null>(null);

// When mounting, reset store to ensure we are in a clean state and fetch history
onMounted(() => {
  store.reset();
  // Fixed: Updated method name to match the store refactoring
  store.fetchRawConversationHistory();
});

// Clean up when leaving the settings page
onUnmounted(() => {
  store.reset();
});

const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
  notification.value = { message, type };
  setTimeout(() => {
    notification.value = null;
  }, 3000);
};
</script>
