<template>
  <div v-if="selectedStep" class="flex flex-col h-full">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2 sm:gap-0">
      <h4 class="text-lg font-medium text-gray-700">Conversations</h4>
      <div class="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
        <button 
          @click="initiateNewConversation" 
          class="w-full sm:w-auto px-4 py-2 sm:px-3 sm:py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-center"
          :disabled="maxConversationsReached"
        >
          New Conversation
        </button>
        <button 
          @click="showConversationHistory" 
          class="w-full sm:w-auto px-4 py-2 sm:px-3 sm:py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-center">
          History
        </button>
      </div>
    </div>

    <!-- Main content area -->
    <div class="flex flex-col flex-grow">
      <!-- Conversation Tabs -->
      <ConversationTabs />

      <!-- Form container -->
      <div class="w-full bg-white pt-4">
        <WorkflowStepRequirementForm />
      </div>
    </div>

    <ConversationHistoryPanel 
      :isOpen="isHistoryPanelOpen"
      :conversations="conversationHistory"
      @close="closeConversationHistory"
      @activate="activateHistoryConversation"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useWorkflowStore } from '~/stores/workflow';
import { useConversationStore } from '~/stores/conversationStore';
import { useConversationHistoryStore } from '~/stores/conversationHistory';
import WorkflowStepRequirementForm from '~/components/stepRequirementForm/WorkflowStepRequirementForm.vue';
import ConversationHistoryPanel from '~/components/conversation/ConversationHistoryPanel.vue';
import ConversationTabs from '~/components/conversation/ConversationTabs.vue';

const MAX_ACTIVE_CONVERSATIONS = 5;

const workflowStore = useWorkflowStore();
const conversationStore = useConversationStore();
const conversationHistoryStore = useConversationHistoryStore();

const selectedStep = computed(() => workflowStore.selectedStep);
const activeConversations = computed(() => conversationStore.activeConversations);
const isHistoryPanelOpen = ref(false);
const conversationHistory = computed(() => conversationHistoryStore.getConversations);

const maxConversationsReached = computed(() => 
  activeConversations.value.length >= MAX_ACTIVE_CONVERSATIONS
);

const initiateNewConversation = () => {
  if (!maxConversationsReached.value) {
    conversationStore.createTemporaryConversation();
    conversationHistoryStore.reset();
  }
};

const showConversationHistory = () => {
  if (selectedStep.value && selectedStep.value.name) {
    conversationHistoryStore.setStepName(selectedStep.value.name);
  }
  isHistoryPanelOpen.value = true;
};

const closeConversationHistory = () => {
  isHistoryPanelOpen.value = false;
};

const activateHistoryConversation = (conversationId: string) => {
  if (!maxConversationsReached.value) {
    conversationStore.setConversationFromHistory(conversationId);
    isHistoryPanelOpen.value = false;
  }
};

// Watcher to handle step activation and create a single temporary conversation
watch(selectedStep, (newStep, oldStep) => {
  if (newStep && newStep.id !== oldStep?.id) {
    conversationHistoryStore.reset();
    workflowStore.setSelectedStepId(newStep.id);
  }
}, { immediate: false });
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