<template>
  <Teleport to="body">
    <div v-if="show" @click.self="closeModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-5xl transform transition-all flex flex-col max-h-[90vh]">
        
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h3 class="text-lg font-medium text-gray-900">Team Launch Configuration</h3>
          <p class="text-sm text-gray-500 mt-1">Configure global settings and agent-specific overrides for "{{ teamDefinition.name }}".</p>
        </div>
        
        <!-- Loading State -->
        <div v-if="!isInitialized" class="flex items-center justify-center h-[60vh]">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          <p class="ml-4 text-gray-600">Preparing launch configuration...</p>
        </div>
        
        <!-- Form Content -->
        <form v-else @submit.prevent="handleLaunch" class="flex-grow contents">
          <div class="flex-grow overflow-y-auto p-6 space-y-8">
            <!-- Global Settings Section -->
            <div>
              <button type="button" @click="uiState.isGlobalConfigExpanded = !uiState.isGlobalConfigExpanded" class="flex items-center justify-between w-full text-left font-medium text-gray-800 p-3 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <span>Global Settings</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" :class="['w-5 h-5 transition-transform', { 'rotate-180': !uiState.isGlobalConfigExpanded }]">
                  <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
                </svg>
              </button>
              <div v-if="uiState.isGlobalConfigExpanded" class="mt-4 p-4 border rounded-md bg-white space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700">Default LLM Model</label>
                  <select v-model="globalConfig.llmModelName" class="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 text-sm">
                    <optgroup v-for="group in llmStore.providersWithModelsForSelection" :key="group.provider" :label="group.provider">
                      <option v-for="model in group.models" :key="model.name" :value="model.name">{{ model.name }}</option>
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Default Workspace</label>
                  <div class="space-y-2">
                    <label class="flex items-center space-x-3 p-3 border rounded-md cursor-pointer" :class="globalConfig.workspaceConfig.mode === 'none' ? 'bg-indigo-50 border-indigo-400' : 'bg-white'">
                      <input type="radio" v-model="globalConfig.workspaceConfig.mode" value="none" class="form-radio" />
                      <span>No Workspace</span>
                    </label>
                    <label class="flex items-start space-x-3 p-3 border rounded-md" :class="[globalConfig.workspaceConfig.mode === 'existing' ? 'bg-indigo-50 border-indigo-400' : 'bg-white', workspaceStore.allWorkspaces.length > 0 ? 'cursor-pointer' : 'cursor-not-allowed opacity-60']">
                      <input type="radio" v-model="globalConfig.workspaceConfig.mode" value="existing" :disabled="workspaceStore.allWorkspaces.length === 0" class="form-radio mt-1" />
                      <div class="flex-grow">
                        <span>Use an Existing Workspace</span>
                        <div v-if="globalConfig.workspaceConfig.mode === 'existing'" class="mt-2 space-y-2">
                          <label v-for="ws in workspaceStore.allWorkspaces" :key="ws.workspaceId" class="flex items-center space-x-3 p-2 border rounded-md cursor-pointer" :class="globalConfig.workspaceConfig.existingWorkspaceId === ws.workspaceId ? 'bg-blue-100 border-blue-400' : 'bg-white'">
                             <input type="radio" v-model="globalConfig.workspaceConfig.existingWorkspaceId" :value="ws.workspaceId" class="form-radio" />
                             <span class="text-sm font-medium">{{ ws.name }} <span class="text-xs text-gray-500 font-mono">({{ ws.workspaceTypeName }})</span></span>
                          </label>
                        </div>
                      </div>
                    </label>
                    <label class="flex items-start space-x-3 p-3 border rounded-md cursor-pointer" :class="globalConfig.workspaceConfig.mode === 'new' ? 'bg-indigo-50 border-indigo-400' : 'bg-white'">
                      <input type="radio" v-model="globalConfig.workspaceConfig.mode" value="new" class="form-radio mt-1" />
                      <div class="flex-grow">
                        <span>Create New Workspace</span>
                        <div v-if="globalConfig.workspaceConfig.mode === 'new'" class="mt-2">
                          <WorkspaceConfigForm v-model="globalConfig.workspaceConfig.newWorkspaceConfig" />
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <!-- Agent-Specific Overrides Section -->
            <div>
              <h4 class="font-medium text-gray-800">Agent-Specific Overrides</h4>
              <div class="mt-2 border rounded-lg overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
                      <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">LLM</th>
                      <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Workspace</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    <template v-for="member in agentMembers" :key="member.memberName">
                      <tr class="align-top">
                        <td class="px-4 py-3 font-medium text-sm text-gray-900">{{ member.memberName }}</td>
                        <td class="px-4 py-3">
                          <select v-model="getMemberOverride(member.memberName).llmModelName" class="block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 text-sm">
                            <option :value="undefined">Default: {{ globalConfig.llmModelName }}</option>
                             <optgroup v-for="group in llmStore.providersWithModelsForSelection" :key="group.provider" :label="group.provider">
                              <option v-for="model in group.models" :key="model.name" :value="model.name">{{ model.name }}</option>
                            </optgroup>
                          </select>
                        </td>
                        <td class="px-4 py-3">
                          <button
                            type="button"
                            @click="toggleWorkspaceEditor(member.memberName)"
                            class="w-full flex items-center justify-between text-left font-mono text-xs p-2 rounded-md transition-colors"
                            :class="getWorkspaceDisplayClass(member.memberName)"
                          >
                            <span>{{ formatWorkspaceConfig(getEffectiveWorkspaceConfig(member.memberName)) }}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" :class="['w-4 h-4 transition-transform', { 'rotate-180': uiState.editingWorkspaceForAgent === member.memberName }]">
                              <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                      <tr v-if="uiState.editingWorkspaceForAgent === member.memberName">
                        <td colspan="3" class="p-4 bg-indigo-50/50">
                           <div class="space-y-2">
                              <label class="flex items-center space-x-3 p-3 border rounded-md cursor-pointer bg-white">
                                <input type="radio" :name="`${member.memberName}-ws-mode`" :checked="!getMemberOverride(member.memberName).workspaceConfig" @change="setMemberWorkspaceMode(member.memberName, 'default')" class="form-radio" />
                                <span>Default: {{ formatWorkspaceConfig(globalConfig.workspaceConfig) }}</span>
                              </label>
                              <label class="flex items-center space-x-3 p-3 border rounded-md cursor-pointer bg-white">
                                <input type="radio" :name="`${member.memberName}-ws-mode`" :checked="getMemberOverride(member.memberName).workspaceConfig?.mode === 'none'" @change="setMemberWorkspaceMode(member.memberName, 'none')" class="form-radio" />
                                <span>No Workspace</span>
                              </label>
                              <label class="flex items-start space-x-3 p-3 border rounded-md bg-white" :class="{ 'cursor-pointer': workspaceStore.allWorkspaces.length > 0, 'cursor-not-allowed opacity-60': workspaceStore.allWorkspaces.length === 0 }">
                                <input type="radio" :name="`${member.memberName}-ws-mode`" :checked="getMemberOverride(member.memberName).workspaceConfig?.mode === 'existing'" @change="setMemberWorkspaceMode(member.memberName, 'existing')" :disabled="workspaceStore.allWorkspaces.length === 0" class="form-radio mt-1" />
                                <div class="flex-grow">
                                  <span>Use an Existing Workspace</span>
                                  <div v-if="getMemberOverride(member.memberName).workspaceConfig?.mode === 'existing'" class="mt-2 space-y-2">
                                    <label v-for="ws in workspaceStore.allWorkspaces" :key="ws.workspaceId" class="flex items-center space-x-3 p-2 border rounded-md cursor-pointer" :class="getMemberOverride(member.memberName).workspaceConfig.existingWorkspaceId === ws.workspaceId ? 'bg-blue-100 border-blue-400' : 'bg-white'">
                                       <input type="radio" v-model="getMemberOverride(member.memberName).workspaceConfig.existingWorkspaceId" :value="ws.workspaceId" class="form-radio" />
                                       <span class="text-sm font-medium">{{ ws.name }} <span class="text-xs text-gray-500 font-mono">({{ ws.workspaceTypeName }})</span></span>
                                    </label>
                                  </div>
                                </div>
                              </label>
                              <label class="flex items-start space-x-3 p-3 border rounded-md cursor-pointer bg-white">
                                <input type="radio" :name="`${member.memberName}-ws-mode`" :checked="getMemberOverride(member.memberName).workspaceConfig?.mode === 'new'" @change="setMemberWorkspaceMode(member.memberName, 'new')" class="form-radio mt-1" />
                                <div class="flex-grow">
                                  <span>Create New Workspace</span>
                                  <div v-if="getMemberOverride(member.memberName).workspaceConfig?.mode === 'new'" class="mt-2">
                                    <WorkspaceConfigForm v-model="getMemberOverride(member.memberName).workspaceConfig.newWorkspaceConfig" />
                                  </div>
                                </div>
                              </label>
                            </div>
                        </td>
                      </tr>
                    </template>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <!-- Footer -->
          <div class="bg-gray-50 px-6 py-3 flex justify-end items-center space-x-3 flex-shrink-0 border-t">
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
import { ref, computed, watch, reactive } from 'vue';
import type { AgentTeamDefinition } from '~/stores/agentTeamDefinitionStore';
import { useLLMProviderConfigStore } from '~/stores/llmProviderConfig';
import { useWorkspaceStore } from '~/stores/workspace';
import { useAgentTeamRunStore } from '~/stores/agentTeamRunStore';
import { useAgentTeamLaunchProfileStore } from '~/stores/agentTeamLaunchProfileStore';
import type { TeamLaunchProfile, WorkspaceLaunchConfig, TeamMemberConfigOverride } from '~/types/TeamLaunchProfile';
import WorkspaceConfigForm from '~/components/workspace/WorkspaceConfigForm.vue';

const props = defineProps<{  show: boolean;
  teamDefinition: AgentTeamDefinition;
  existingProfile?: TeamLaunchProfile | null;
}>();

const emit = defineEmits(['close', 'success']);

const llmStore = useLLMProviderConfigStore();
const workspaceStore = useWorkspaceStore();
const agentTeamRunStore = useAgentTeamRunStore();
const teamProfileStore = useAgentTeamLaunchProfileStore();

const isSubmitting = ref(false);
const isInitialized = ref(false);

const uiState = reactive({
  isGlobalConfigExpanded: true,
  editingWorkspaceForAgent: null as string | null,
});

const globalConfig = reactive<TeamLaunchProfile['globalConfig']>({
  llmModelName: '',
  workspaceConfig: { mode: 'none' },
  autoExecuteTools: true,
  parseToolCalls: true,
});
const memberOverrides = reactive<Record<string, TeamMemberConfigOverride>>({});

const agentMembers = computed(() => props.teamDefinition.nodes.filter(node => node.referenceType === 'AGENT'));

const getMemberOverride = (memberName: string): TeamMemberConfigOverride => {
  if (!memberOverrides[memberName]) {
    memberOverrides[memberName] = { memberName };
  }
  return memberOverrides[memberName];
};

const getEffectiveWorkspaceConfig = (memberName: string): WorkspaceLaunchConfig => {
  return getMemberOverride(memberName).workspaceConfig || globalConfig.workspaceConfig;
};

const getWorkspaceDisplayClass = (memberName: string) => {
  const baseClasses = "hover:bg-opacity-80";
  if (getMemberOverride(memberName).workspaceConfig) {
    return `bg-indigo-100 text-indigo-800 ${baseClasses}`;
  }
  return `bg-gray-100 text-gray-800 ${baseClasses}`;
};

const toggleWorkspaceEditor = (memberName: string) => {
  uiState.editingWorkspaceForAgent = uiState.editingWorkspaceForAgent === memberName ? null : memberName;
};

const setMemberWorkspaceMode = (memberName: string, mode: 'default' | 'none' | 'existing' | 'new') => {
  const override = getMemberOverride(memberName);
  if (mode === 'default') {
    delete override.workspaceConfig;
    uiState.editingWorkspaceForAgent = null; // Auto-collapse
    return;
  }
  
  // Auto-collapse for simple selections
  if (mode === 'none' || (mode === 'existing' && workspaceStore.allWorkspaces.length > 0)) {
     uiState.editingWorkspaceForAgent = null;
  }
  
  if (!override.workspaceConfig || override.workspaceConfig.mode !== mode) {
    const newConfig: WorkspaceLaunchConfig = { mode };
    if (mode === 'existing' && workspaceStore.allWorkspaces.length > 0) {
      newConfig.existingWorkspaceId = workspaceStore.allWorkspaces[0].workspaceId;
    }
    if (mode === 'new') {
      newConfig.newWorkspaceConfig = { typeName: '', params: {} };
      if (workspaceStore.availableWorkspaceTypes.length > 0) {
        const defaultType = workspaceStore.availableWorkspaceTypes[0];
        newConfig.newWorkspaceConfig.typeName = defaultType.name;
        const newParams: Record<string, any> = {};
        defaultType.config_schema.parameters.forEach(p => { newParams[p.name] = p.default_value ?? '' });
        newConfig.newWorkspaceConfig.params = newParams;
      }
    }
    override.workspaceConfig = newConfig;
  }
};


const initializeFormState = () => {
  uiState.isGlobalConfigExpanded = true;
  uiState.editingWorkspaceForAgent = null;

  if (props.existingProfile) {
    Object.assign(globalConfig, JSON.parse(JSON.stringify(props.existingProfile.globalConfig)));
    Object.keys(memberOverrides).forEach(key => delete memberOverrides[key]);
    props.existingProfile.memberOverrides.forEach(ov => {
      memberOverrides[ov.memberName] = JSON.parse(JSON.stringify(ov));
    });
  } else {
    // Default for new launch
    globalConfig.llmModelName = llmStore.models.length > 0 ? llmStore.models[0] : '';
    globalConfig.workspaceConfig = { mode: 'none' };
    globalConfig.autoExecuteTools = true;
    globalConfig.parseToolCalls = true;
    Object.keys(memberOverrides).forEach(key => delete memberOverrides[key]);
  }
};

const formatWorkspaceConfig = (config: WorkspaceLaunchConfig): string => {
  switch (config.mode) {
    case 'none': return 'None';
    case 'existing':
      const ws = workspaceStore.allWorkspaces.find(w => w.workspaceId === config.existingWorkspaceId);
      return `Existing: ${ws?.name || 'Select...'}`;
    case 'new':
      const typeName = config.newWorkspaceConfig?.typeName;
      const params = config.newWorkspaceConfig?.params || {};
      let detail = '';

      if (typeName === 'local_workspace' && params.root_path && typeof params.root_path === 'string') {
        const pathParts = params.root_path.replace(/\\/g, '/').split('/').filter(Boolean);
        detail = `(.../${pathParts.pop() || '..'})`;
      } else if (typeName === 'ssh_remote' && params.host && typeof params.host === 'string') {
        detail = `(${params.host})`;
      } else if (typeName && params.image && typeof params.image === 'string') { // Common for docker-like
        detail = `(${params.image.split(':')[0]})`;
      }

      return `New: ${typeName || 'Select...'} ${detail}`;
    default: return 'Use Team Default';
  }
};

watch(() => props.show, async (isVisible) => {
  if (isVisible) {
    isInitialized.value = false;
    await Promise.all([
      llmStore.fetchProvidersWithModels(),
      workspaceStore.fetchAvailableWorkspaceTypes()
    ]);
    initializeFormState();
    isInitialized.value = true;
  }
}, { immediate: true });

watch(() => globalConfig.workspaceConfig.mode, (newMode) => {
  if (newMode === 'new' && !globalConfig.workspaceConfig.newWorkspaceConfig) {
    const newWorkspaceConfig = { typeName: '', params: {} };
    if (workspaceStore.availableWorkspaceTypes.length > 0) {
      const defaultType = workspaceStore.availableWorkspaceTypes[0];
      newWorkspaceConfig.typeName = defaultType.name;
      const newParams: Record<string, any> = {};
      defaultType.config_schema.parameters.forEach(p => { newParams[p.name] = p.default_value ?? '' });
      newWorkspaceConfig.params = newParams;
    }
    globalConfig.workspaceConfig.newWorkspaceConfig = newWorkspaceConfig;
  }

  if (newMode === 'existing' && !globalConfig.workspaceConfig.existingWorkspaceId) {
    if (workspaceStore.allWorkspaces.length > 0) {
      globalConfig.workspaceConfig.existingWorkspaceId = workspaceStore.allWorkspaces[0].workspaceId;
    }
  }
});

const handleLaunch = async () => {
  isSubmitting.value = true;
  try {
    // 1. Create a persistent profile from the form data. This returns the full profile object with a real UUID.
    const newPersistentProfile = teamProfileStore.createLaunchProfile(props.teamDefinition, {
      name: `${props.teamDefinition.name} Launch - ${new Date().toLocaleTimeString()}`,
      globalConfig: JSON.parse(JSON.stringify(globalConfig)),
      memberOverrides: JSON.parse(JSON.stringify(Object.values(memberOverrides).filter(ov => Object.keys(ov).length > 1))),
    });

    // 2. Call the run store's launch action with the newly created, persistent profile.
    const result = await agentTeamRunStore.launchNewInstanceFromProfile(newPersistentProfile);

    if (result.success && result.teamId) {
      // The profile is already saved. We just need to emit success.
      emit('success', result.teamId);
      closeModal();
    } else {
      // If launch fails, the profile still exists. This is acceptable.
      alert(`Failed to launch team: ${result.message}`);
    }
  } catch (error: any) {
    console.error("Error launching team:", error);
    alert(`An unexpected error occurred: ${error.message}`);
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
