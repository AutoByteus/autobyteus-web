<template>
  <div class="w-full h-full flex flex-col bg-gray-50">
    <!-- Header -->
    <div class="flex-shrink-0 flex justify-between items-center p-4 border-b border-gray-200 bg-white">
      <h1 class="text-xl font-semibold text-gray-800">Socratic Math Teacher</h1>
      <button 
        @click="handleReset"
        class="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        Start New Problem
      </button>
    </div>

    <!-- Chat Display -->
    <ChatDisplay
      :team-context="teamContext"
      :error="error"
      class="flex-grow"
    />
    
    <!-- Loading overlay -->
    <div v-if="isLoading" class="p-2 border-t border-gray-200 flex items-center text-sm text-gray-500 bg-gray-50">
        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
        <span>The AI is thinking...</span>
    </div>

    <!-- Input Form -->
    <AppChatInput
      :is-loading="isLoading"
      v-model:problemText="problemText"
      v-model:contextFiles="contextFiles"
      @submit="handleSubmit"
      class="flex-shrink-0"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useApplicationRunStore } from '~/stores/applicationRunStore';
import { useApplicationContextStore } from '~/stores/applicationContextStore';
import { useAgentTeamDefinitionStore } from '~/stores/agentTeamDefinitionStore';
import AppChatInput from './components/AppChatInput.vue';
import ChatDisplay from './components/ChatDisplay.vue';
import type { ContextFilePath } from '~/types/conversation';
import type { AgentTeamDefinition } from '~/stores/agentTeamDefinitionStore';

const APP_ID = "socratic_math_teacher";
const TEAM_DEFINITION_NAME = "Socratic Math Team";

// Stores
const applicationRunStore = useApplicationRunStore();
const appContextStore = useApplicationContextStore();
const agentTeamDefStore = useAgentTeamDefinitionStore();

// Local State
const instanceId = ref<string | null>(null);
const teamDefinition = ref<AgentTeamDefinition | null>(null);
const error = ref<string | null>(null);
const problemText = ref('');
const contextFiles = ref<ContextFilePath[]>([]);


onMounted(async () => {
  await agentTeamDefStore.fetchAllAgentTeamDefinitions();
  const def = agentTeamDefStore.getAgentTeamDefinitionByName(TEAM_DEFINITION_NAME);
  if (!def) {
    error.value = `Critical Error: Team Definition "${TEAM_DEFINITION_NAME}" not found.`;
    console.error(error.value);
  } else {
    teamDefinition.value = def;
  }
});

// Clean up the application run when the user navigates away
onUnmounted(() => {
  if (instanceId.value) {
    appContextStore.removeRun(instanceId.value);
  }
});

// Computed properties to drive the UI
const runContext = computed(() => {
  return instanceId.value ? appContextStore.getRun(instanceId.value) : null;
});

const teamContext = computed(() => runContext.value?.teamContext || null);

const isLoading = computed(() => {
  if (!teamDefinition.value) return true; // Loading dependencies
  if (applicationRunStore.isLaunching) return true; // Actively launching
  // Check the phase of the coordinator agent
  const coordinatorPhase = teamContext.value?.members.get(teamContext.value.focusedMemberName)?.state.currentPhase;
  if (coordinatorPhase && coordinatorPhase !== 'DONE' && coordinatorPhase !== 'UNINITIALIZED' && coordinatorPhase !== 'ERROR') {
      return true;
  }
  return false;
});

// Methods
async function handleSubmit() {
  error.value = null;
  if (isLoading.value || !problemText.value.trim()) return;
  
  const payload = {
    problemText: problemText.value,
    contextFiles: contextFiles.value,
  };

  // Clear inputs immediately for better UX
  problemText.value = '';
  contextFiles.value = [];
  
  try {
    let currentInstanceId = instanceId.value;

    if (!currentInstanceId) {
      if (!teamDefinition.value) throw new Error("Team definition not ready.");
      
      const agentLlmConfig = {};
      teamDefinition.value.nodes.forEach(node => {
        agentLlmConfig[node.memberName] = 'bedrock-claude-v2'; // Sensible default
      });

      currentInstanceId = await applicationRunStore.launchApplication({
        appId: APP_ID,
        teamDefinition: teamDefinition.value,
        agentLlmConfig,
      });
      instanceId.value = currentInstanceId;
    }

    await applicationRunStore.sendMessageToApplication(
      currentInstanceId,
      payload.problemText,
      payload.contextFiles.map(cf => ({ path: cf.path, type: cf.type.toUpperCase() }))
    );
  } catch (e: any) {
    console.error("Error during submission:", e);
    error.value = e.message || "An unknown error occurred during submission.";
    // Restore inputs on failure
    problemText.value = payload.problemText;
    contextFiles.value = payload.contextFiles;
  }
}

function handleReset() {
  if (instanceId.value) {
    appContextStore.removeRun(instanceId.value);
    instanceId.value = null;
  }
  error.value = null;
  problemText.value = '';
  contextFiles.value = [];
}
</script>
