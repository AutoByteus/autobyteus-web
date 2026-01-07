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
                             <span class="text-sm font-medium">{{ ws.name }}</span>
                          </label>
                        </div>
                      </div>
                    </label>
                    <label class="flex items-start space-x-3 p-3 border rounded-md cursor-pointer" :class="globalConfig.workspaceConfig.mode === 'new' ? 'bg-indigo-50 border-indigo-400' : 'bg-white'">
                      <input type="radio" v-model="globalConfig.workspaceConfig.mode" value="new" class="form-radio mt-1" />
                      <div class="flex-grow">
                        <span>Create New Workspace</span>
                        <div v-if="globalConfig.workspaceConfig.mode === 'new' && globalConfig.workspaceConfig.newWorkspaceConfig" class="mt-2">
                          <WorkspaceConfigForm v-model="globalConfig.workspaceConfig.newWorkspaceConfig" />
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
                <div class="pt-4 border-t">
                  <label class="block text-sm font-medium text-gray-700 mb-2">Default Auto-Execute Tools</label>
                  <div class="space-y-2">
                    <label class="flex items-start space-x-3 p-3 border rounded-md cursor-pointer" :class="globalConfig.autoExecuteTools ? 'bg-indigo-50 border-indigo-400' : 'bg-white'">
                      <input type="checkbox" v-model="globalConfig.autoExecuteTools" class="form-checkbox h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300 mt-1" />
                      <div>
                        <span class="font-medium">Enabled</span>
                        <p class="text-xs text-gray-500">Allow agents to execute tools without manual confirmation. This sets the initial value for all agents below.</p>
                      </div>
                    </label>
                  </div>
                </div>

              </div>
            </div>

            <!-- Agent-Specific Overrides Section -->
            <div>
              <h4 class="font-medium text-gray-800">Agent-Specific Overrides</h4>
              <div class="mt-2 border rounded-lg overflow-hidden">
                <table class="min-w-full divide-y divide-gray-200 table-fixed">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-1/5">Agent</th>
                      <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-3/10">LLM</th>
                      <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-3/10">Workspace</th>
                      <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-1/5">Auto-Exec Tools</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    <template v-for="member in agentMembers" :key="member.memberName">
                      <tr class="align-top">
                        <td class="px-3 py-3 font-medium text-sm text-gray-900 truncate">{{ member.memberName }}</td>
                        <td class="px-3 py-3">
                           <button
                              type="button"
                              @click="toggleOverrideEditor(member.memberName, 'llm')"
                              class="w-full flex items-start justify-between text-left text-sm p-2 rounded-md transition-colors bg-gray-100 text-gray-800 hover:bg-gray-200"
                            >
                              <span class="break-words">{{ formatLlmButtonLabel(member.memberName) }}</span>
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" :class="['w-4 h-4 transition-transform flex-shrink-0 ml-2', { 'rotate-180': isOverrideEditorOpen(member.memberName, 'llm') }]">
                                <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
                              </svg>
                            </button>
                        </td>
                        <td class="px-3 py-3">
                           <button
                              type="button"
                              @click="toggleOverrideEditor(member.memberName, 'workspace')"
                              class="w-full flex items-start justify-between text-left text-sm p-2 rounded-md transition-colors bg-gray-100 text-gray-800 hover:bg-gray-200"
                            >
                              <span class="break-words">{{ formatWorkspaceButtonLabel(member.memberName) }}</span>
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" :class="['w-4 h-4 transition-transform flex-shrink-0 ml-2', { 'rotate-180': isOverrideEditorOpen(member.memberName, 'workspace') }]">
                                <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
                              </svg>
                            </button>
                        </td>
                        <td class="px-3 py-3">
                            <button
                                type="button"
                                @click="toggleAutoExecuteState(member.memberName)"
                                :class="getAutoExecuteButtonState(member.memberName).classes"
                            >
                                {{ getAutoExecuteButtonState(member.memberName).text }}
                            </button>
                        </td>
                      </tr>
                      <tr v-if="isOverrideEditorOpen(member.memberName, 'llm')">
                        <td colspan="4" class="p-3 bg-gray-50">
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
                        <td colspan="4" class="p-4 bg-gray-50">
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
                                  <div v-if="getMemberOverride(member.memberName).workspaceConfig && getMemberOverride(member.memberName).workspaceConfig.mode === 'existing'" class="mt-2 space-y-2">
                                    <label v-for="ws in workspaceStore.allWorkspaces" :key="ws.workspaceId" class="flex items-center space-x-3 p-2 border rounded-md cursor-pointer" :class="getMemberOverride(member.memberName).workspaceConfig.existingWorkspaceId === ws.workspaceId ? 'bg-blue-100 border-blue-400' : 'bg-white'">
                                       <input type="radio" v-model="getMemberOverride(member.memberName).workspaceConfig.existingWorkspaceId" :value="ws.workspaceId" class="form-radio" />
                                       <span class="text-sm font-medium">{{ ws.name }}</span>
                                    </label>
                                  </div>
                                </div>
                              </label>
                              <label class="flex items-start space-x-3 p-3 border rounded-md cursor-pointer bg-white">
                                <input type="radio" :name="`${member.memberName}-ws-mode`" :checked="getMemberOverride(member.memberName).workspaceConfig?.mode === 'new'" @change="setMemberWorkspaceMode(member.memberName, 'new')" class="form-radio mt-1" />
                                <div class="flex-grow">
                                  <span>Create New Workspace</span>
                                  <div v-if="getMemberOverride(member.memberName).workspaceConfig?.mode === 'new' && getMemberOverride(member.memberName).workspaceConfig?.newWorkspaceConfig" class="mt-2">
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
import { ref, computed, watch, reactive, onUpdated, onBeforeUpdate } from 'vue';
import type { AgentTeamDefinition } from '~/stores/agentTeamDefinitionStore';
import { useLLMProviderConfigStore } from '~/stores/llmProviderConfig';
import { useWorkspaceStore } from '~/stores/workspace';
import { useAgentTeamRunStore } from '~/stores/agentTeamRunStore';
import type { TeamLaunchProfile, WorkspaceLaunchConfig, TeamMemberConfigOverride, GroupedOption } from '~/types/TeamLaunchProfile';
import WorkspaceConfigForm from '~/components/workspace/config/WorkspaceConfigForm.vue';
import InlineSearchableGroupedList from '~/components/agentTeams/InlineSearchableGroupedList.vue';

const props = defineProps<{
  show: boolean;
  teamDefinition: AgentTeamDefinition;
  existingProfile?: TeamLaunchProfile | null;
}>();

const emit = defineEmits(['close', 'success']);

const llmStore = useLLMProviderConfigStore();
const workspaceStore = useWorkspaceStore();
const teamRunStore = useAgentTeamRunStore();

const isSubmitting = computed(() => teamRunStore.isLaunching);
const isInitialized = ref(false);
let initialConfigSnapshot: string | null = null;

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

  maxTurns: 30, // Default value
});
const memberOverrides = reactive<Record<string, TeamMemberConfigOverride>>({});

const agentMembers = computed(() => props.teamDefinition.nodes.filter(node => node.referenceType === 'AGENT'));

const hasChanges = computed(() => {
  if (!props.existingProfile || !initialConfigSnapshot) {
    return false;
  }
  const currentConfig = {
    globalConfig: globalConfig,
    memberOverrides: Object.values(memberOverrides).filter(ov => Object.keys(ov).length > 1),
  };
  return JSON.stringify(currentConfig) !== initialConfigSnapshot;
});

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
        delete override.llmModelIdentifier;
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
      const params = config.newWorkspaceConfig;
      let detail = '';

      if (params && params.root_path) {
        const pathParts = params.root_path.replace(/\\/g, '/').split('/').filter(Boolean);
        detail = `(.../${pathParts.pop() || '..'})`;
      }

      return `${prefix}New: ${detail || 'Select...'}`;
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
      // Single workspace type: filesystem with root_path
      newConfig.newWorkspaceConfig = { root_path: '' };
    }
    override.workspaceConfig = newConfig;
  }
};

// --- Logic for Auto-Execute Button ---
const toggleAutoExecuteState = (memberName: string) => {
  const override = getMemberOverride(memberName);
  override.autoExecuteTools = !override.autoExecuteTools;
};

const getAutoExecuteButtonState = (memberName: string): { text: string; classes: string } => {
  const isEnabled = getMemberOverride(memberName).autoExecuteTools;
  const baseClasses = 'w-full text-sm font-medium py-1.5 px-3 rounded-md transition-all shadow-sm border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 hover:shadow-md hover:-translate-y-px';

  if (isEnabled) {
    return { text: 'On', classes: `${baseClasses} bg-indigo-100 text-indigo-800 border-indigo-300 hover:bg-indigo-200 focus-visible:ring-indigo-500` };
  } else {
    return { text: 'Off', classes: `${baseClasses} bg-white text-gray-700 border-gray-300 hover:bg-gray-50 focus-visible:ring-indigo-500` };
  }
};
// --- End Logic for Auto-Execute Button ---


const initializeFormState = () => {
  uiState.isGlobalConfigExpanded = true;
  uiState.editingAgentOverride = null;
  
  if (props.existingProfile) {
    Object.assign(globalConfig, JSON.parse(JSON.stringify(props.existingProfile.globalConfig)));
    initialConfigSnapshot = JSON.stringify({
      globalConfig: props.existingProfile.globalConfig,
      memberOverrides: props.existingProfile.memberOverrides || [],
    });
  } else {
    globalConfig.llmModelIdentifier = '';
    globalConfig.workspaceConfig = { mode: 'none' };
    globalConfig.autoExecuteTools = true;

    initialConfigSnapshot = null;
  }

  // Clear and repopulate overrides, ensuring every agent has an explicit autoExecuteTools value
  Object.keys(memberOverrides).forEach(key => delete memberOverrides[key]);
  agentMembers.value.forEach(member => {
    const existingOverride = props.existingProfile?.memberOverrides?.find(ov => ov.memberName === member.memberName);
    const newOverride = getMemberOverride(member.memberName);

    if (existingOverride) {
      Object.assign(newOverride, JSON.parse(JSON.stringify(existingOverride)));
    }
    
    // Ensure autoExecuteTools is explicitly set
    if (newOverride.autoExecuteTools === undefined) {
      newOverride.autoExecuteTools = globalConfig.autoExecuteTools;
    }
  });
};


watch(() => props.show, async (isVisible) => {
  if (isVisible) {
    isInitialized.value = false;
    // Initialize global config first
    if (props.existingProfile) {
      Object.assign(globalConfig, JSON.parse(JSON.stringify(props.existingProfile.globalConfig)));
    } else {
      globalConfig.llmModelIdentifier = '';
      globalConfig.workspaceConfig = { mode: 'none' };
      globalConfig.autoExecuteTools = true;

    }
    
    initializeFormState(); 

    await Promise.all([
      llmStore.fetchProvidersWithModels(),
      workspaceStore.fetchAllWorkspaces(),
    ]);

    if (!globalConfig.llmModelIdentifier && llmStore.models.length > 0) {
      globalConfig.llmModelIdentifier = llmStore.models[0];
    }
    
    // Re-run initialization to ensure agent overrides are set based on fetched/finalized global config
    initializeFormState();

    isInitialized.value = true;
  }
}, { immediate: true });


watch(() => globalConfig.workspaceConfig.mode, (newMode) => {
  if (newMode === 'new' && !globalConfig.workspaceConfig.newWorkspaceConfig) {
    // Single workspace type: filesystem with root_path
    globalConfig.workspaceConfig.newWorkspaceConfig = { root_path: '' };
  }

  if (newMode === 'existing' && !globalConfig.workspaceConfig.existingWorkspaceId) {
    if (workspaceStore.allWorkspaces.length > 0) {
      globalConfig.workspaceConfig.existingWorkspaceId = workspaceStore.allWorkspaces[0].workspaceId;
    }
  }
});

const handleLaunch = async () => {
  try {
    if (props.existingProfile && !hasChanges.value) {
      // Reactivation Flow (No Changes)
      await teamRunStore.launchExistingTeam(props.existingProfile.id);
    } else {
      // Creation Flow (New or Modified Profile)
      const getBaseName = (profile?: TeamLaunchProfile | null, definition?: AgentTeamDefinition): string => {
        const nameSource = profile ? profile.name : (definition ? definition.name : 'Untitled');
        // Find the first space followed by an opening parenthesis (for old format)
        const versionIndex = nameSource.search(/\s\(/);
        if (versionIndex !== -1) {
          return nameSource.substring(0, versionIndex).trim();
        }
        // Fallback for old format with " - "
        return nameSource.split(' - ')[0].trim();
      };

      const baseName = getBaseName(props.existingProfile, props.teamDefinition);
      
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const dateSuffix = `${year}-${month}-${day} ${hours}:${minutes}`;

      const newProfileName = `${baseName} - ${dateSuffix}`;

      const launchConfigPayload = {
        teamDefinition: props.teamDefinition,
        name: newProfileName,
        globalConfig: JSON.parse(JSON.stringify(globalConfig)),
        memberOverrides: JSON.parse(JSON.stringify(Object.values(memberOverrides).filter(ov => Object.keys(ov).length > 1))),
      };
      await teamRunStore.createAndLaunchTeam(launchConfigPayload);
    }
    
    emit('success');
  } catch(error) {
    console.error("Launch failed from modal:", error);
    // The alert is already handled in the store, no need to show another one.
  }
};

const closeModal = () => {
  if (!isSubmitting.value) {
    emit('close');
  }
};
</script>
