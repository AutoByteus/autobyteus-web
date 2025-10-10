<template>
  <div class="flex w-full h-full bg-white font-sans">
    <!-- PHASE 1: LAUNCH CONFIGURATION -->
    <div v-if="!teamId" class="w-full max-w-4xl mx-auto p-8">
      <div v-if="isLoading" class="h-full flex flex-col items-center justify-center text-gray-500">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <p class="mt-4 font-semibold">Loading Application...</p>
      </div>
      <div v-else-if="error" class="h-full flex flex-col items-center justify-center text-red-500 bg-red-50 p-8 rounded-lg">
        <h2 class="text-xl font-bold mb-2">Error Loading Application</h2>
        <p>{{ error }}</p>
      </div>
      <div v-else-if="app && teamDef">
        <div class="mb-6">
          <h1 class="text-3xl font-bold text-gray-900">{{ app.name }}</h1>
          <p class="text-lg text-gray-500 mt-2">{{ app.description }}</p>
        </div>
        
        <form @submit.prevent="handleLaunch" class="space-y-6 bg-gray-50 p-6 rounded-lg border">
          <h2 class="text-xl font-semibold text-gray-800 border-b pb-3">Configure Team Models</h2>
          <p class="text-sm text-gray-600">Select the LLM model that each agent in the team will use.</p>

          <div v-for="agentName in requiredAgentNames" :key="agentName">
            <label :for="`llm-select-${agentName}`" class="block text-sm font-medium text-gray-700 mb-1">
              {{ agentName }}
            </label>
            <SearchableGroupedSelect
              :id="`llm-select-${agentName}`"
              v-model="memberLlmConfig[agentName]"
              :options="llmOptions"
              :loading="llmStore.isLoadingModels"
              placeholder="Select a model..."
            />
          </div>

          <div class="pt-4 flex justify-end">
            <button
              type="submit"
              :disabled="isLaunchDisabled"
              class="w-full sm:w-auto bg-blue-600 text-white font-bold py-3 px-6 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              <svg v-if="teamRunStore.isLaunching" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{{ teamRunStore.isLaunching ? 'Launching...' : `Launch ${app.name}` }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- PHASE 2: INTERACTION UI -->
    <div v-else class="w-full h-full">
       <Suspense>
          <template #default>
            <SocraticMathTeacherApp :team-id="teamId" />
          </template>
          <template #fallback>
            <div class="h-full flex flex-col items-center justify-center text-gray-500">
              <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              <p class="mt-4 font-semibold">Loading Application Interface...</p>
            </div>
          </template>
        </Suspense>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive, defineAsyncComponent } from 'vue';
import { useRoute } from 'vue-router';
import { useMutation } from '@vue/apollo-composable';
import { CreateAgentTeamInstance } from '~/graphql/mutations/agentTeamInstanceMutations';
import { useApplicationStore, type ApplicationManifest } from '~/stores/applicationStore';
import { useAgentTeamDefinitionStore, type AgentTeamDefinition } from '~/stores/agentTeamDefinitionStore';
import { useAgentTeamRunStore } from '~/stores/agentTeamRunStore';
import { useLLMProviderConfigStore } from '~/stores/llmProviderConfig';
import SearchableGroupedSelect, { type GroupedOption } from '~/components/agentTeams/SearchableGroupedSelect.vue';
import type { TeamMemberConfigInput } from '~/generated/graphql';

const SocraticMathTeacherApp = defineAsyncComponent(() => import(`~/applications/socratic_math_teacher/index.vue`));

const route = useRoute();
const appId = route.params.id as string;

// STORES
const appStore = useApplicationStore();
const teamDefStore = useAgentTeamDefinitionStore();
const teamRunStore = useAgentTeamRunStore();
const llmStore = useLLMProviderConfigStore();

// STATE
const teamId = ref<string | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);
const app = ref<ApplicationManifest | null>(null);
const teamDef = ref<AgentTeamDefinition | null>(null);
const memberLlmConfig = reactive<Record<string, string>>({});

// --- DATA FETCHING & INITIALIZATION ---
onMounted(async () => {
  try {
    await Promise.all([
      appStore.fetchApplications(),
      teamDefStore.fetchAllAgentTeamDefinitions(),
      llmStore.fetchProvidersWithModels()
    ]);

    const foundApp = appStore.getApplicationById(appId);
    if (!foundApp) throw new Error(`Application with ID '${appId}' not found.`);
    if (foundApp.type !== 'AGENT_TEAM') throw new Error(`Application '${foundApp.name}' is not a team-based application.`);
    app.value = foundApp;

    const foundTeamDef = teamDefStore.getAgentTeamDefinitionByName(foundApp.teamDefinitionName!);
    if (!foundTeamDef) throw new Error(`Required team definition '${foundApp.teamDefinitionName}' not found.`);
    teamDef.value = foundTeamDef;

    // Pre-populate model selections
    if (llmStore.models.length > 0) {
      foundTeamDef.nodes.forEach(node => {
        if (node.referenceType === 'AGENT') {
          memberLlmConfig[node.memberName] = llmStore.models[0];
        }
      });
    }

  } catch (e: any) {
    error.value = e.message;
  } finally {
    isLoading.value = false;
  }
});

// --- COMPUTED PROPERTIES ---
const llmOptions = computed((): GroupedOption[] => {
  return llmStore.providersWithModelsForSelection.map(p => ({
    label: p.provider,
    items: p.models.map(m => ({ id: m.modelIdentifier, name: m.modelIdentifier }))
  }));
});

const requiredAgentNames = computed(() => {
  if (!teamDef.value) return [];
  return teamDef.value.nodes
    .filter(node => node.referenceType === 'AGENT')
    .map(node => node.memberName);
});

const isLaunchDisabled = computed(() => {
  if (teamRunStore.isLaunching || !teamDef.value) return true;
  return requiredAgentNames.value.some(name => !memberLlmConfig[name]);
});

// --- METHODS ---
async function handleLaunch() {
  if (isLaunchDisabled.value || !app.value || !teamDef.value) return;

  const { mutate: createTeamInstance } = useMutation(CreateAgentTeamInstance);

  try {
    // This object contains the extra 'agentDefinitionId' field, which is useful on the frontend but rejected by the API.
    const memberConfigsWithFrontendData = teamDef.value.nodes
      .filter(n => n.referenceType === 'AGENT')
      .map(node => ({
        memberName: node.memberName,
        agentDefinitionId: node.referenceId,
        llmModelIdentifier: memberLlmConfig[node.memberName],
        workspaceId: null, // Hardcoded default
        autoExecuteTools: true, // Hardcoded default
      }));

    // **FIX**: Create a new array for the API call that strips out the extra 'agentDefinitionId' field.
    const memberConfigsForApi = memberConfigsWithFrontendData.map(({ agentDefinitionId, ...rest }) => rest);

    const result = await createTeamInstance({
      input: {
        teamDefinitionId: teamDef.value.id,
        memberConfigs: memberConfigsForApi, // Use the cleaned array
        taskNotificationMode: 'AGENT_MANUAL_NOTIFICATION', // Hardcoded default
        useXmlToolFormat: true, // **FIX**: Set to true as requested
      }
    });

    const newTeamId = result?.data?.createAgentTeamInstance?.teamId;
    if (!newTeamId) {
      throw new Error(result?.data?.createAgentTeamInstance?.message || "Failed to create team instance.");
    }
    
    teamId.value = newTeamId;

  } catch (e: any) {
    console.error("Failed to launch application team:", e);
    error.value = `Launch Failed: ${e.message}`;
  }
}
</script>
