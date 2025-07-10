<template>
  <div class="flex flex-col h-full">
    <!-- Error and Loading States -->
    <div v-if="error" class="alert alert-error mb-4 p-4 bg-red-100 text-red-700 rounded-md">
      <ExclamationTriangleIcon class="w-5 h-5 mr-2 inline" /> {{ error }}
    </div>
    <div v-if="loading" class="alert alert-info mb-4 p-4 bg-blue-100 text-blue-700 rounded-md">
      <ArrowPathIcon class="w-5 h-5 mr-2 inline animate-spin" /> Loading session...
    </div>

    <!-- Main Content -->
    <div v-if="activeSession" class="flex flex-col h-full">
      <!-- Header: Agent Name and Action buttons -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 px-3 pt-1 pb-0">
        <h4 class="text-lg font-medium text-gray-700">{{ activeSession.name }}</h4>
        <div class="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
          <button 
            @click="handleNewConversation" 
            class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-blue-500 tooltip transition-colors"
            aria-label="New Conversation"
            data-tooltip="New Conversation"
          >
            <PlusCircleIcon class="w-6 h-6" />
          </button>
          <button 
            @click="handleShowConversationHistory" 
            class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 tooltip transition-colors"
            aria-label="History"
            data-tooltip="History"
          >
            <ClockIcon class="w-6 h-6" />
          </button>
        </div>
      </div>

      <!-- Area for Conversation and Input Form -->
      <div class="flex flex-col flex-grow overflow-hidden">
        <ConversationTabs class="flex-grow min-h-0" />
      </div>

      <!-- Conversation History Panel (modal, separate from this layout flow) -->
      <ConversationHistoryPanel 
        :isOpen="isHistoryPanelOpen"
        :conversations="historicalConversations" 
        @close="closeConversationHistory"
      />
    </div>
     <div v-else-if="!loading && !error && !agentSessionStore.activeSessionId" class="p-4 text-center text-gray-500">
      Please select or create an agent session to begin.
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
import { useAgentSessionStore } from '~/stores/agentSessionStore';
import { useConversationStore } from '~/stores/conversationStore';
import { useConversationHistoryStore } from '~/stores/conversationHistory';
import ConversationHistoryPanel from '~/components/conversation/ConversationHistoryPanel.vue';
import ConversationTabs from '~/components/conversation/ConversationTabs.vue';
import { 
  PlusCircleIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/vue/24/solid';

const agentSessionStore = useAgentSessionStore();
const conversationStore = useConversationStore();
const conversationHistoryStore = useConversationHistoryStore();

const loading = ref(false);
const error = ref<string | null>(null);
const isHistoryPanelOpen = ref(false);

const activeSession = computed(() => agentSessionStore.activeSession);
const historicalConversations = computed(() => conversationHistoryStore.getConversations);

onMounted(() => {
  watch(() => agentSessionStore.activeSessionId, 
    (newSessionId) => {
      if (newSessionId) {
        // This ensures that when a session becomes active, we either select
        // its latest conversation or create a new one.
        conversationStore.ensureConversationForSession(newSessionId);
      }
    }, 
    { immediate: true }
  );
});

const handleNewConversation = () => {
  if (activeSession.value) {
    conversationStore.createNewConversation();
  } else {
    alert("Please select an active session to create a new conversation.");
  }
};

const handleShowConversationHistory = () => {
  if (activeSession.value) {
    conversationHistoryStore.setAgentDefinitionId(activeSession.value.agentDefinition.id); 
    isHistoryPanelOpen.value = true;
  } else {
    alert("No active session to show history for.")
  }
};

const closeConversationHistory = () => {
  isHistoryPanelOpen.value = false;
};
</script>

<style scoped>
.tooltip {
  position: relative;
}

.tooltip:hover::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: -25px; 
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 8px;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 10;
}
</style>
