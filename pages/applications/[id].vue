<template>
  <div class="flex w-full h-full bg-white font-sans">
    <!-- PHASE 1: LAUNCH CONFIGURATION -->
    <div v-if="!instanceId" class="w-full max-w-4xl mx-auto p-8">
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
          <p class="text-sm text-gray-600">Your selections will be automatically saved for your next visit.</p>

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
              <svg v-if="applicationRunStore.isLaunching" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{{ applicationRunStore.isLaunching ? 'Launching...' : `Launch ${app.name}` }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- PHASE 2: INTERACTION UI -->
    <div v-else class="w-full h-full">
       <Suspense>
          <template #default>
            <SocraticMathTeacherApp :instance-id="instanceId" @reset="handleReset" />
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
import { useApplicationStore, type ApplicationManifest } from '~/stores/applicationStore';
import { useAgentTeamDefinitionStore, type AgentTeamDefinition } from '~/stores/agentTeamDefinitionStore';
import { useApplicationRunStore } from '~/stores/applicationRunStore';
import { useApplicationLaunchProfileStore } from '~/stores/applicationLaunchProfileStore';
import { useLLMProviderConfigStore } from '~/stores/llmProviderConfig';
import SearchableGroupedSelect, { type GroupedOption } from '~/components/agentTeams/SearchableGroupedSelect.vue';
import type { ApplicationLaunchProfile } from '~/types/application/ApplicationLaunchProfile';

// This is hardcoded for now. A more robust solution would dynamically import the correct component.
const SocraticMathTeacherApp = defineAsyncComponent(() => import(`~/applications/socratic_math_teacher/index.vue`));

const route = useRoute();
const appId = route.params.id as string;

// STORES
const appStore = useApplicationStore();
const teamDefStore = useAgentTeamDefinitionStore();
const applicationRunStore = useApplicationRunStore();
const appProfileStore = useApplicationLaunchProfileStore();
const llmStore = useLLMProviderConfigStore();

// STATE
const instanceId = ref<string | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);
const app = ref<ApplicationManifest | null>(null);
const teamDef = ref<AgentTeamDefinition | null>(null);
const activeProfile = ref<ApplicationLaunchProfile | null>(null);
const memberLlmConfig = reactive<Record<string, string>>({});

// --- DATA FETCHING & INITIALIZATION ---
onMounted(async () => {
  try {
    await Promise.all([
      appStore.fetchApplications(),
      teamDefStore.fetchAllAgentTeamDefinitions(),
      llmStore.fetchProvidersWithModels(),
      appProfileStore.loadLaunchProfiles()
    ]);

    const foundApp = appStore.getApplicationById(appId);
    if (!foundApp) throw new Error(`Application with ID '${appId}' not found.`);
    if (foundApp.type !== 'AGENT_TEAM') throw new Error(`Application '${foundApp.name}' is not a team-based application.`);
    app.value = foundApp;

    const foundTeamDef = teamDefStore.getAgentTeamDefinitionByName(foundApp.teamDefinitionName!);
    if (!foundTeamDef) throw new Error(`Required team definition '${foundApp.teamDefinitionName}' not found.`);
    teamDef.value = foundTeamDef;

    // Find the latest saved profile for this app to pre-populate selections
    const profiles = appProfileStore.getProfilesForApp(appId);
    if (profiles.length > 0) {
      activeProfile.value = profiles[0];
      Object.assign(memberLlmConfig, activeProfile.value.agentLlmConfig);
    }

    // Ensure all required agents have a default model selected if not in profile
    if (llmStore.models.length > 0) {
      requiredAgentNames.value.forEach(agentName => {
        if (!memberLlmConfig[agentName]) {
          memberLlmConfig[agentName] = llmStore.defaultLlmIdentifier || llmStore.models[0];
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
  if (applicationRunStore.isLaunching || !teamDef.value) return true;
  return requiredAgentNames.value.some(name => !memberLlmConfig[name]);
});

// --- METHODS ---
async function handleLaunch() {
  if (isLaunchDisabled.value || !app.value || !teamDef.value) return;

  try {
    // If a default profile already exists, remove it so we can save the new one.
    if (activeProfile.value) {
      appProfileStore.deleteLaunchProfile(activeProfile.value.id);
    }
    
    // Launch the application, which also creates a new default profile with the current selections.
    const result = await applicationRunStore.createProfileAndLaunchApplication({
      appId: appId,
      profileName: `${app.value.name} - Default Profile`,
      teamDefinition: teamDef.value,
      agentLlmConfig: memberLlmConfig,
    });
    
    instanceId.value = result.instanceId;

  } catch (e: any) {
    console.error("Failed to launch application:", e);
    error.value = `Launch Failed: ${e.message}`;
  }
}

function handleReset() {
  instanceId.value = null;
  // The onUnmounted hook in the child component handles backend termination.
  // We just need to reset the view here to show the config screen again.
}
</script>
