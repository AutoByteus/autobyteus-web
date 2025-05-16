<template>
  <div class="flex flex-col h-full">
    <!-- Error and Loading States -->
    <div v-if="error" class="alert alert-error mb-4 p-4 bg-red-100 text-red-700 rounded-md">
      <ExclamationTriangleIcon class="w-5 h-5 mr-2 inline" /> {{ error }}
    </div>
    <div v-if="loading" class="alert alert-info mb-4 p-4 bg-blue-100 text-blue-700 rounded-md">
      <ArrowPathIcon class="w-5 h-5 mr-2 inline animate-spin" /> Loading workflow...
    </div>

    <!-- Main Content -->
    <div v-if="currentSelectedStepInWorkflow" class="flex flex-col h-full">
      <!-- Header: Step Name, New/History buttons - THIS STAYS VISIBLE -->
      <!-- Changed padding to pt-1 pb-0. Reduced button and icon sizes. -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 px-3 pt-1 pb-0">
        <h4 class="text-lg font-medium text-gray-700">{{ currentSelectedStepInWorkflow.name }}</h4>
        <div class="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
          <button 
            @click="handleInitiateNewConversation" 
            class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-blue-500 tooltip transition-colors"
            aria-label="New Conversation"
            data-tooltip="New Conversation"
            :disabled="!workflowStore.currentSelectedStepId"
          >
            <PlusCircleIcon class="w-6 h-6" />
          </button>
          <button 
            @click="handleShowConversationHistory" 
            class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 tooltip transition-colors"
            aria-label="History"
            data-tooltip="History"
            :disabled="!currentSelectedStepInWorkflow"
          >
            <ClockIcon class="w-6 h-6" />
          </button>
        </div>
      </div>

      <!-- Area for Conversation and Input Form -->
      <!-- This container will manage the layout of ConversationTabs -->
      <!-- ConversationTabs will now contain the WorkflowStepRequirementForm internally -->
      <div class="flex flex-col flex-grow overflow-hidden">
        
        <!-- ConversationTabs takes up the majority of the space and handles its own scrolling -->
        <!-- Its internal structure (tabs + scrollable content panel) will now include the form -->
        <ConversationTabs class="flex-grow min-h-0" />

        <!-- WorkflowStepRequirementForm is REMOVED from here -->
      </div>

      <!-- Conversation History Panel (modal, separate from this layout flow) -->
      <ConversationHistoryPanel 
        :isOpen="isHistoryPanelOpen"
        :conversations="historicalConversations" 
        @close="closeConversationHistory"
      />
    </div>
     <div v-else-if="!loading && !error && !workspaceStore.currentSelectedWorkspaceId" class="p-4 text-center text-gray-500">
      Please select a workspace to begin.
    </div>
    <div v-else-if="!loading && !error && workspaceStore.currentSelectedWorkspaceId && !workflowStore.currentWorkflow" class="p-4 text-center text-gray-500">
      No workflow configured for this workspace, or workflow is empty.
    </div>
     <div v-else-if="!loading && !error && workspaceStore.currentSelectedWorkspaceId && workflowStore.currentWorkflow && !currentSelectedStepInWorkflow" class="p-4 text-center text-gray-500">
      Workflow loaded, but no step is currently selected. This state should be auto-resolved.
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
import { useWorkflowStore } from '~/stores/workflow';
import { useConversationStore } from '~/stores/conversationStore';
import { useConversationHistoryStore } from '~/stores/conversationHistory';
import { useWorkspaceStore } from '~/stores/workspace';
// WorkflowStepRequirementForm import is removed
import ConversationHistoryPanel from '~/components/conversation/ConversationHistoryPanel.vue';
import ConversationTabs from '~/components/conversation/ConversationTabs.vue';
import { 
  PlusCircleIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/vue/24/solid';

const workflowStore = useWorkflowStore();
const conversationStore = useConversationStore();
const conversationHistoryStore = useConversationHistoryStore();
const workspaceStore = useWorkspaceStore();

const loading = ref(false);
const error = ref<string | null>(null);
const isHistoryPanelOpen = ref(false);

const currentSelectedStepInWorkflow = computed(() => workflowStore.selectedStep); 
const historicalConversations = computed(() => conversationHistoryStore.getConversations);

const loadWorkflowForCurrentWorkspace = async () => {
  if (workspaceStore.currentSelectedWorkspaceId) {
    loading.value = true;
    error.value = null;
    try {
      await workflowStore.fetchWorkflowConfig(workspaceStore.currentSelectedWorkspaceId);
      // Initial conversation ensuring is now handled within workflowStore.fetchWorkflowConfig
    } catch (err: any) { // Added opening curly brace
      error.value = err.message || 'Failed to fetch workflow.';
      console.error("Workflow fetch error in component:", err);
    } finally { // Closing curly brace for catch block
      loading.value = false;
    }
  } else {
     workflowStore.setWorkflow(null); // Clear workflow if no workspace is selected
  }
};

onMounted(() => {
  // Watch for the workspace ID to be set initially, then load workflow
  // Using immediate: true ensures it runs if workspaceId is already set when component mounts
  watch(() => workspaceStore.currentSelectedWorkspaceId, 
    (newWorkspaceId) => {
      if (newWorkspaceId) {
        loadWorkflowForCurrentWorkspace();
      } else {
        workflowStore.setWorkflow(null); // Clear workflow if workspace is deselected
      }
    }, 
    { immediate: true }
  );
});


// Watcher to synchronize workflow step selection FROM selected conversation tab
watch(() => conversationStore.selectedConversation, (newSelectedConv) => {
  if (newSelectedConv && newSelectedConv.stepId) {
    if (newSelectedConv.stepId !== workflowStore.currentSelectedStepId) {
      workflowStore.setSelectedStepId(newSelectedConv.stepId);
    }
  }
  // If newSelectedConv is null (e.g., all tabs closed, and store couldn't create a new one)
  // we don't necessarily change workflowStore.currentSelectedStepId here.
  // The workflowStore.currentSelectedStepId remains, and a new conversation might be created
  // for it by other logic if needed (e.g., user clicks '+').
}, { deep: true }); 

// The watcher for workflowStore.currentSelectedStepId to ensure a conversation
// (which was previously here with immediate:true) is no longer needed here,
// as this responsibility has been moved into workflowStore.fetchWorkflowConfig's onResult.

const handleInitiateNewConversation = () => {
  if (workflowStore.currentSelectedStepId) {
    conversationStore.createTemporaryConversation(workflowStore.currentSelectedStepId);
  } else {
    alert("Please select a workflow step first, or wait for workflow to load.");
  }
};

const handleShowConversationHistory = () => {
  if (currentSelectedStepInWorkflow.value && currentSelectedStepInWorkflow.value.name) {
    conversationHistoryStore.setStepName(currentSelectedStepInWorkflow.value.name); 
    isHistoryPanelOpen.value = true;
  } else {
    alert("No step selected to show history for.")
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
