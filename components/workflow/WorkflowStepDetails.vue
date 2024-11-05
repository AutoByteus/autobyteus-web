<template>
  <div v-if="selectedStep" class="flex flex-col h-full">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2 sm:gap-0">
      <h4 class="text-lg font-medium text-gray-700">Conversation</h4>
      <div class="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
        <button 
          @click="initiateNewConversation" 
          class="w-full sm:w-auto px-4 py-2 sm:px-3 sm:py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-center">
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
      <!-- Conversation container -->
      <div class="flex-grow overflow-y-auto min-h-0">
        <Conversation v-if="activeConversation" :conversation="activeConversation" />
      </div>

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
import Conversation from '~/components/conversation/Conversation.vue';

const workflowStore = useWorkflowStore();
const conversationStore = useConversationStore();
const conversationHistoryStore = useConversationHistoryStore();

const selectedStep = computed(() => workflowStore.selectedStep);
const activeConversation = computed(() => conversationStore.currentConversation);

const isHistoryPanelOpen = ref(false);
const conversationHistory = computed(() => conversationHistoryStore.getConversations);

const initiateNewConversation = () => {
  conversationStore.resetConversation();
  conversationHistoryStore.reset();
  // The actual conversation creation will occur when the user submits a requirement
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
  conversationStore.resetConversation();
  conversationStore.setConversationId(conversationId);
  isHistoryPanelOpen.value = false;
};

watch(selectedStep, (newStep, oldStep) => {
  if (newStep && newStep.id !== oldStep?.id) {
    conversationStore.resetConversation();
    conversationHistoryStore.reset();
  }
}, { immediate: true });
</script>

<style scoped>
/* Add any additional styles here */
/* Ensure messages wrap properly on small screens */
</style>