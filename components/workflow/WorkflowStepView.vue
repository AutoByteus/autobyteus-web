<template>
  <div v-if="selectedStep" class="flex flex-col h-full">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2 sm:gap-0">
      <h4 class="text-lg font-medium text-gray-700">Conversations</h4>
      <div class="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
        <button 
          @click="initiateNewConversation" 
          class="w-full sm:w-auto px-4 py-2 sm:px-3 sm:py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-center"
        >
          New Conversation
        </button>
        <button 
          @click="showConversationHistory" 
          class="w-full sm:w-auto px-4 py-2 sm:px-3 sm:py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-center"
        >
          History
        </button>
      </div>
    </div>

    <!-- Main content area -->
    <div class="flex flex-col flex-grow">
      <!-- Conversation Tabs -->
      <ConversationTabs />

      <!-- Content Tabs -->
      <TabList
        :tabs="contentTabs"
        :selectedTab="activeContentTab"
        @select="setActiveContentTab"
      />

      <!-- Tab Content -->
      <div class="flex-grow">
        <!-- Requirement Form -->
        <div v-show="activeContentTab === 'Requirement Form'" class="w-full bg-white pt-4">
          <WorkflowStepRequirementForm />
        </div>

        <!-- Terminal -->
        <div v-show="activeContentTab === 'Terminal'" class="w-full h-full">
          <Terminal :isVisible="activeContentTab === 'Terminal'" />
        </div>
      </div>
    </div>

    <!-- Conversation History Panel -->
    <ConversationHistoryPanel 
      :isOpen="isHistoryPanelOpen"
      :conversations="conversationHistory"
      @close="closeConversationHistory"
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
import Terminal from '~/components/workflow/Terminal.vue';
import TabList from '~/components/tabs/TabList.vue';

const workflowStore = useWorkflowStore();
const conversationStore = useConversationStore();
const conversationHistoryStore = useConversationHistoryStore();

const selectedStep = computed(() => workflowStore.selectedStep);
const isHistoryPanelOpen = ref(false);
const conversationHistory = computed(() => conversationHistoryStore.getConversations);

// Tab management
const activeContentTab = ref('Requirement Form');
const contentTabs = [
  { name: 'Requirement Form' },
  { name: 'Terminal' }
];

const setActiveContentTab = (tabName: string) => {
  activeContentTab.value = tabName;
};

const initiateNewConversation = () => {
  conversationStore.createTemporaryConversation();
  conversationHistoryStore.reset();
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

watch(selectedStep, (newStep, oldStep) => {
  if (newStep && newStep.id !== oldStep?.id) {
    workflowStore.setSelectedStepId(newStep.id);
  }
}, { immediate: false });
</script>

<style scoped>
/* Add any additional styles if necessary */
</style>
