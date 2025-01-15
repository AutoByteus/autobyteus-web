<template>
  <div class="flex flex-col h-full">
    <!-- Error and Loading States -->
    <div v-if="error" class="alert alert-error mb-4 p-4 bg-red-100 text-red-700 rounded-md">
      <i class="fas fa-exclamation-triangle mr-2"></i> {{ error }}
    </div>
    <div v-if="loading" class="alert alert-info mb-4 p-4 bg-blue-100 text-blue-700 rounded-md">
      <i class="fas fa-spinner fa-spin mr-2"></i> Loading...
    </div>

    <!-- Main Content -->
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

        <!-- Content Area -->
        <div class="flex-grow">
          <div class="w-full bg-white pt-4">
            <WorkflowStepRequirementForm />
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
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
import { useWorkflowStore } from '~/stores/workflow';
import { useConversationStore } from '~/stores/conversationStore';
import { useConversationHistoryStore } from '~/stores/conversationHistory';
import { useWorkspaceStore } from '~/stores/workspace';
import WorkflowStepRequirementForm from '~/components/stepRequirementForm/WorkflowStepRequirementForm.vue';
import ConversationHistoryPanel from '~/components/conversation/ConversationHistoryPanel.vue';
import ConversationTabs from '~/components/conversation/ConversationTabs.vue';

const workflowStore = useWorkflowStore();
const conversationStore = useConversationStore();
const conversationHistoryStore = useConversationHistoryStore();
const workspaceStore = useWorkspaceStore();

const loading = ref(false);
const error = ref<string | null>(null);
const isHistoryPanelOpen = ref(false);

const selectedStep = computed(() => workflowStore.selectedStep);
const conversationHistory = computed(() => conversationHistoryStore.getConversations);

// Fetch workflow data
const fetchWorkflow = async () => {
  if (!workspaceStore.currentSelectedWorkspaceId) return;
  loading.value = true;
  error.value = null;
  try {
    await workflowStore.fetchWorkflowConfig(workspaceStore.currentSelectedWorkspaceId);
  } catch (err: any) {
    error.value = err.message || 'Failed to fetch workflow.';
  } finally {
    loading.value = false;
  }
};

// Initialize
onMounted(fetchWorkflow);

// Watch for workspace changes
watch(
  () => workspaceStore.currentSelectedWorkspaceId,
  (newId, oldId) => {
    if (newId && newId !== oldId) {
      fetchWorkflow();
    }
  }
);

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
</script>
