<template>
  <Teleport to="body">
    <div v-if="show" @click.self="closeModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl transform transition-all">
        <!-- Loading State -->
        <div v-if="!isInitialized" class="flex items-center justify-center h-[50vh]">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          <p class="ml-4 text-gray-600">Preparing launch configuration...</p>
        </div>
        
        <!-- Form Content -->
        <form v-else @submit.prevent="handleLaunch">
          <!-- Header -->
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">Team Launch Configuration</h3>
            <p class="text-sm text-gray-500 mt-1">Configure "{{ teamDefinition.name }}" for launch.</p>
          </div>

          <!-- Body -->
          <div class="px-6 py-5 space-y-6 max-h-[70vh] overflow-y-auto">
            <!-- Global Settings -->
            <fieldset class="p-4 border rounded-md bg-gray-50">
              <legend class="text-base font-semibold text-gray-800 px-2">Global Settings</legend>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <label class="block text-sm font-medium text-gray-700">Default LLM Model</label>
                  <select v-model="globalLlmModelName" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                    <optgroup v-for="group in llmStore.providersWithModelsForSelection" :key="group.provider" :label="group.provider">
                      <option v-for="model in group.models" :key="model.name" :value="model.name">{{ model.name }}</option>
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Default Workspace</label>
                  <select v-model="globalWorkspaceId" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                    <option :value="null">None</option>
                    <option v-for="ws in workspaceStore.allWorkspaces" :key="ws.workspaceId" :value="ws.workspaceId">{{ ws.name }}</option>
                  </select>
                </div>
              </div>
            </fieldset>

            <!-- Member Overrides -->
            <fieldset>
              <legend class="text-base font-semibold text-gray-800">Agent-Specific Overrides</legend>
              <div class="mt-2 border rounded-lg overflow-hidden">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Agent Name</th>
                      <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">LLM Model</th>
                      <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Workspace</th>
                      <th class="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Auto-Execute</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    <tr v-for="member in agentMembers" :key="member.memberName">
                      <td class="px-4 py-2 font-medium text-sm text-gray-900">{{ member.memberName }}</td>
                      <td class="px-4 py-2">
                        <select v-model="overrides[member.memberName].llmModelName" class="block w-full border-gray-300 rounded-md shadow-sm text-sm">
                          <option value="">Use Team Default</option>
                          <optgroup v-for="group in llmStore.providersWithModelsForSelection" :key="group.provider" :label="group.provider">
                            <option v-for="model in group.models" :key="model.name" :value="model.name">{{ model.name }}</option>
                          </optgroup>
                        </select>
                      </td>
                      <td class="px-4 py-2">
                         <select v-model="overrides[member.memberName].workspaceId" class="block w-full border-gray-300 rounded-md shadow-sm text-sm">
                          <option value="">Use Team Default</option>
                           <option v-for="ws in workspaceStore.allWorkspaces" :key="ws.workspaceId" :value="ws.workspaceId">{{ ws.name }}</option>
                        </select>
                      </td>
                      <td class="px-4 py-2 text-center">
                        <input type="checkbox" v-model="overrides[member.memberName].autoExecuteTools" class="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </fieldset>
          </div>

          <!-- Footer -->
          <div class="bg-gray-50 px-6 py-3 flex justify-end items-center space-x-3">
            <button type="button" @click="closeModal" class="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" :disabled="isSubmitting" class="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center">
              <span v-if="isSubmitting" class="i-heroicons-arrow-path-20-solid w-4 h-4 mr-2 animate-spin"></span>
              {{ isSubmitting ? 'Launching...' : 'Launch Team' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { AgentTeamDefinition } from '~/stores/agentTeamDefinitionStore';
import type { TeamLaunchProfile } from '~/types/TeamLaunchProfile';
import { useLLMProviderConfigStore } from '~/stores/llmProviderConfig';
import { useWorkspaceStore } from '~/stores/workspace';
import { useAgentTeamRunStore } from '~/stores/agentTeamRunStore';
import type { TeamMemberConfigInput } from '~/generated/graphql';

const props = defineProps<{  show: boolean;
  teamDefinition: AgentTeamDefinition;
  existingProfile?: TeamLaunchProfile | null;
}>();

const emit = defineEmits(['close', 'success']);

const llmStore = useLLMProviderConfigStore();
const workspaceStore = useWorkspaceStore();
const agentTeamRunStore = useAgentTeamRunStore();

const isSubmitting = ref(false);
const isInitialized = ref(false);

const globalLlmModelName = ref('');
const globalWorkspaceId = ref<string | null>(null);
const overrides = ref<Record<string, { llmModelName: string; workspaceId: string; autoExecuteTools: boolean }>>({});

const agentMembers = computed(() => {
  return props.teamDefinition.nodes.filter(node => node.referenceType === 'AGENT');
});

const initializeFormState = () => {
  if (props.existingProfile) {
    const config = props.existingProfile.teamConfig;
    globalLlmModelName.value = config.globalLlmModelName;
    globalWorkspaceId.value = config.globalWorkspaceId;
    
    const initialOverrides: typeof overrides.value = {};
    agentMembers.value.forEach(member => {
      const savedConfig = config.memberConfigs.find(c => c.memberName === member.memberName);
      initialOverrides[member.memberName] = {
        llmModelName: savedConfig?.llmModelName || '',
        workspaceId: savedConfig?.workspaceId || '',
        autoExecuteTools: savedConfig?.autoExecuteTools ?? true,
      };
    });
    overrides.value = initialOverrides;
  } else {
    globalLlmModelName.value = llmStore.models.length > 0 ? llmStore.models[0] : '';
    globalWorkspaceId.value = null;
    
    const initialOverrides: typeof overrides.value = {};
    agentMembers.value.forEach(member => {
      initialOverrides[member.memberName] = {
        llmModelName: '',
        workspaceId: '',
        autoExecuteTools: true,
      };
    });
    overrides.value = initialOverrides;
  }
};

watch(() => props.show, async (isVisible) => {
  if (isVisible) {
    isInitialized.value = false;
    isSubmitting.value = false;
    await llmStore.fetchProvidersWithModels();
    initializeFormState();
    isInitialized.value = true;
  } else {
    isInitialized.value = false;
  }
}, { immediate: true });

const handleLaunch = async () => {
  if (!isInitialized.value) return;
  isSubmitting.value = true;
  try {
    const memberConfigs: TeamMemberConfigInput[] = agentMembers.value.map(member => ({
      memberName: member.memberName,
      llmModelName: overrides.value[member.memberName].llmModelName || globalLlmModelName.value,
      workspaceId: overrides.value[member.memberName].workspaceId || globalWorkspaceId.value,
      autoExecuteTools: overrides.value[member.memberName].autoExecuteTools,
    }));
    
    const result = await agentTeamRunStore.launchTeamAndSubscribe(props.teamDefinition.id, memberConfigs);

    if (result.success && result.teamId) {
      emit('success', result.teamId);
      closeModal();
    } else {
      alert(`Failed to launch team: ${result.message}`);
    }
  } catch (error) {
    console.error("Error launching team:", error);
    alert("An unexpected error occurred while launching the team.");
  } finally {
    isSubmitting.value = false;
  }
};

const closeModal = () => {
  if (!isSubmitting.value) {
    emit('close');
  }
};
</script>
