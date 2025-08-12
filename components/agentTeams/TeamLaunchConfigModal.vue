# file: autobyteus-web/components/agentTeams/TeamLaunchConfigModal.vue
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
                  <label class="block text-sm font-medium text-gray-700 mb-1">Default LLM Model</label>
                  <InlineSearchableGroupedList
                    v-model="globalConfig.llmModelIdentifier"
                    :options="llmGroupedOptions"
                    placeholder="Select a default model..."
                    search-placeholder="Search models..."
                    :button-class="'w-full text-left px-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50'"
                  />
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
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Task Notification Mode</label>
                  <div class="space-y-2">
                    <label class="flex items-center space-x-3 p-3 border rounded-md cursor-pointer" :class="globalConfig.taskNotificationMode === 'AGENT_MANUAL_NOTIFICATION' ? 'bg-indigo-50 border-indigo-400' : 'bg-white'">
                      <input type="radio" v-model="globalConfig.taskNotificationMode" value="AGENT_MANUAL_NOTIFICATION" class="form-radio" />
                      <div>
                        <span class="font-medium">Agent Manual</span>
                        <p class="text-xs text-gray-500">The coordinator agent is responsible for telling other agents to start tasks.</p>
                      </div>
                    </label>
                    <label class="flex items-center space-x-3 p-3 border rounded-md cursor-pointer" :class="globalConfig.taskNotificationMode === 'SYSTEM_EVENT_DRIVEN' ? 'bg-indigo-50 border-indigo-400' : 'bg-white'">
                      <input type="radio" v-model="globalConfig.taskNotificationMode" value="SYSTEM_EVENT_DRIVEN" class="form-radio" />
                      <div>
                        <span class="font-medium">System Event-Driven</span>
                        <p class="text-xs text-gray-500">The system automatically notifies agents when their tasks are ready to start.</p>
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
                           <button
                              type="button"
                              @click="toggleOverrideEditor(member.memberName, 'llm')"
                              class="w-full flex items-start justify-between text-left text-sm p-2 rounded-md transition-colors bg-gray-100 text-gray-800 hover:bg-gray-200"
                            >
                              <span>{{ formatLlmButtonLabel(member.memberName) }}</span>
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" :class="['w-4 h-4 transition-transform flex-shrink-0 ml-2', { 'rotate-180': isOverrideEditorOpen(member.memberName, 'llm') }]">
                                <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
                              </svg>
                            </button>
                        </td>
                        <td class="px-4 py-3">
                           <button
                              type="button"
                              @click="toggleOverrideEditor(member.memberName, 'workspace')"
                              class="w-full flex items-start justify-between text-left text-sm p-2 rounded-md transition-colors bg-gray-100 text-gray-800 hover:bg-gray-200"
                            >
                              <span>{{ formatWorkspaceButtonLabel(member.memberName) }}</span>
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" :class="['w-4 h-4 transition-transform flex-shrink-0 ml-2', { 'rotate-180': isOverrideEditorOpen(member.memberName, 'workspace') }]">
                                <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
                              </svg>
                            </button>
                        </td>
                      </tr>
                      <tr v-if="isOverrideEditorOpen(member.memberName, 'llm')">
                        <td colspan="3" class="p-3 bg-gray-50">
                          <div class="border rounded-md p-2 bg-white max-h-80 overflow-y-auto">
                              <input type="text" v-model="uiState.agentLlmSearch" placeholder="Search models..." class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sticky top-0 z-10" />
                              <div class="mt-2">
                                <div v-if="filteredOverrideLlmOptions.length === 0" class="p-3 text-sm text-center text-gray-500">No models found.</div>
                                <div v-for="group in filteredOverrideLlmOptions" :key="group.label" class="py-1">
                                    <div class="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ group.label }}</div>
                                    <ul>
                                      <li v-for="item in group.items" :key="item.id" @click="selectAgentLlm(member.memberName, item.id)" class="pl-6 pr-3 py-2 text-sm text-gray-800 cursor-pointer hover:bg-blue-100">
                                        {{ item.name }}
                                      </li>
                                    </ul>
                                </div>
                              </div>
                          </div>
                        </td>
                      </tr>
                      <tr v-if="isOverrideEditorOpen(member.memberName, 'workspace')">
                        <td colspan="3" class="p-4 bg-gray-50">
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
              {{ isSubmitting ? 'Setting up...' : 'Set up Team' }}
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
import { useAgentTeamLaunchProfileStore } from '~/stores/agentTeamLaunchProfileStore';
import { useAgentTeamRunStore } from '~/stores/agentTeamRunStore';
import type { TeamLaunchProfile, WorkspaceLaunchConfig, TeamMemberConfigOverride, GroupedOption } from '~/types/TeamLaunchProfile';
import WorkspaceConfigForm from '~/components/workspace/WorkspaceConfigForm.vue';
import InlineSearchableGroupedList from '~/components/agentTeams/InlineSearchableGroupedList.vue';

const props = defineProps<{  show: boolean;
  teamDefinition: AgentTeamDefinition;
  existingProfile?: TeamLaunchProfile | null;
}>();

const emit = defineEmits(['close', 'success']);

const llmStore = useLLMProviderConfigStore();
const workspaceStore = useWorkspaceStore();
const teamProfileStore = useAgentTeamLaunchProfileStore();
const teamRunStore = useAgentTeamRunStore();

const isSubmitting = computed(() => teamRunStore.isLaunching);
const isInitialized = ref(false);

const DEFAULT_OPTION_ID = '---use-default---';

const uiState = reactive({
  isGlobalConfigExpanded: true,
  agentLlmSearch: '',
  editingAgentOverride: null as { memberName: string; type: 'llm' | 'workspace' } | null,
});

const globalConfig = reactive<TeamLaunchProfile['globalConfig']>({
  llmModelIdentifier: '',
  workspaceConfig: { mode: 'none' },
  autoExecuteTools: true,
  parseToolCalls: true,
  taskNotificationMode: 'AGENT_MANUAL_NOTIFICATION',
});
const memberOverrides = reactive<Record<string, TeamMemberConfigOverride>>({});

const agentMembers = computed(() => props.teamDefinition.nodes.filter(node => node.referenceType === 'AGENT'));

const llmGroupedOptions = computed((): GroupedOption[] => {
  if (!llmStore.providersWithModelsForSelection) return [];
  
  return llmStore.providersWithModelsForSelection.map(group => {
    const uniqueModels: { id: string; name: string }[] = [];
    const seenIdentifiers = new Set<string>();

    for (const model of group.models) {
      if (!seenIdentifiers.has(model.modelIdentifier)) {
        uniqueModels.push({
          id: model.modelIdentifier,
          name: model.modelIdentifier,
        });
        seenIdentifiers.add(model.modelIdentifier);
      }
    }
    
    return {
      label: group.provider,
      items: uniqueModels,
    };
  });
});

const overrideLlmGroupedOptions = computed((): GroupedOption[] => {
  const defaultItem = {
    id: DEFAULT_OPTION_ID,
    name: `Default: ${globalConfig.llmModelIdentifier || 'Not Set'}`,
  };
  
  return [
    { label: 'Inherit from Global', items: [defaultItem] },
    ...llmGroupedOptions.value
  ];
});

const filteredOverrideLlmOptions = computed(() => {
    const options = overrideLlmGroupedOptions.value;
    if (!uiState.agentLlmSearch) return options;
    const searchLower = uiState.agentLlmSearch.toLowerCase();
    return options.map(group => ({
        ...group,
        items: group.items.filter(item => item.name.toLowerCase().includes(searchLower))
    })).filter(group => group.items.length > 0);
});

const selectAgentLlm = (memberName: string, modelId: string | null) => {
    const override = getMemberOverride(memberName);
    if (modelId === DEFAULT_OPTION_ID || modelId === null) {
        override.llmModelIdentifier = undefined;
    } else {
        override.llmModelIdentifier = modelId;
    }
    uiState.editingAgentOverride = null;
    uiState.agentLlmSearch = '';
};

const getMemberOverride = (memberName: string): TeamMemberConfigOverride => {
  if (!memberOverrides[memberName]) {
    memberOverrides[memberName] = { memberName };
  }
  return memberOverrides[memberName];
};

const getEffectiveWorkspaceConfig = (memberName: string): WorkspaceLaunchConfig => {
  return getMemberOverride(memberName).workspaceConfig || globalConfig.workspaceConfig;
};

const formatLlmButtonLabel = (memberName: string): string => {
    const model = getMemberOverride(memberName).llmModelIdentifier;
    if (model) {
      return model;
    }
    const defaultModel = globalConfig.llmModelIdentifier;
    return `Default: ${defaultModel || 'Not Set'}`;
};

const formatWorkspaceButtonLabel = (memberName: string): string => {
    const config = getEffectiveWorkspaceConfig(memberName);
    const isDefault = !getMemberOverride(memberName).workspaceConfig;
    return formatWorkspaceConfig(config, isDefault);
};

const formatWorkspaceConfig = (config: WorkspaceLaunchConfig, isDefault: boolean = false): string => {
  const prefix = isDefault ? 'Default: ' : '';
  switch (config.mode) {
    case 'none': return `${prefix}No Workspace`;
    case 'existing':
      const ws = workspaceStore.allWorkspaces.find(w => w.workspaceId === config.existingWorkspaceId);
      return `${prefix}Existing: ${ws?.name || 'Select...'}`;
    case 'new':
      const typeName = config.newWorkspaceConfig?.typeName;
      const params = config.newWorkspaceConfig?.params || {};
      let detail = '';

      if (typeName === 'local_workspace' && params.root_path && typeof params.root_path === 'string') {
        const pathParts = params.root_path.replace(/\\/g, '/').split('/').filter(Boolean);
        detail = `(.../${pathParts.pop() || '..'})`;
      } else if (typeName === 'ssh_remote' && params.host && typeof params.host === 'string') {
        detail = `(${params.host})`;
      } else if (typeName && params.image && typeof params.image === 'string') {
        detail = `(${params.image.split(':')[0]})`;
      }

      return `${prefix}New: ${typeName || 'Select...'} ${detail}`;
    default: return 'Select...';
  }
};

const toggleOverrideEditor = (memberName: string, type: 'llm' | 'workspace') => {
  if (uiState.editingAgentOverride?.memberName === memberName && uiState.editingAgentOverride?.type === type) {
    uiState.editingAgentOverride = null;
  } else {
    uiState.editingAgentOverride = { memberName, type };
  }
};

const isOverrideEditorOpen = (memberName: string, type: 'llm' | 'workspace') => {
    return uiState.editingAgentOverride?.memberName === memberName && uiState.editingAgentOverride?.type === type;
}

const setMemberWorkspaceMode = (memberName: string, mode: 'default' | 'none' | 'existing' | 'new') => {
  const override = getMemberOverride(memberName);
  if (mode === 'default') {
    delete override.workspaceConfig;
    toggleOverrideEditor(memberName, 'workspace'); // Close editor
    return;
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
  uiState.editingAgentOverride = null;
  
  if (props.existingProfile) {
    Object.assign(globalConfig, JSON.parse(JSON.stringify(props.existingProfile.globalConfig)));
  } else {
    // Reset to a blank state. Defaults will be populated after data is fetched.
    globalConfig.llmModelIdentifier = '';
    globalConfig.workspaceConfig = { mode: 'none' };
    globalConfig.autoExecuteTools = true;
    globalConfig.parseToolCalls = true;
    globalConfig.taskNotificationMode = 'AGENT_MANUAL_NOTIFICATION';
  }

  // Clear and repopulate overrides
  Object.keys(memberOverrides).forEach(key => delete memberOverrides[key]);
  if (props.existingProfile?.memberOverrides) {
    props.existingProfile.memberOverrides.forEach(ov => {
      memberOverrides[ov.memberName] = JSON.parse(JSON.stringify(ov));
    });
  }
};


watch(() => props.show, async (isVisible) => {
  if (isVisible) {
    isInitialized.value = false;
    initializeFormState(); 

    await Promise.all([
      llmStore.fetchProvidersWithModels(),
      workspaceStore.fetchAvailableWorkspaceTypes(),
    ]);

    if (!globalConfig.llmModelIdentifier && llmStore.models.length > 0) {
      globalConfig.llmModelIdentifier = llmStore.models[0];
    }

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
  const newPersistentProfile = teamProfileStore.createLaunchProfile(props.teamDefinition, {
    name: `${props.teamDefinition.name} - ${new Date().toLocaleTimeString()}`,
    globalConfig: JSON.parse(JSON.stringify(globalConfig)),
    memberOverrides: JSON.parse(JSON.stringify(Object.values(memberOverrides).filter(ov => Object.keys(ov).length > 1))),
  });

  teamProfileStore.setActiveLaunchProfile(newPersistentProfile.id);

  await teamRunStore.activateTeamProfile(newPersistentProfile);
  
  emit('success');
  closeModal();
};

const closeModal = () => {
  if (!isSubmitting.value) {
    emit('close');
  }
};
</script>
