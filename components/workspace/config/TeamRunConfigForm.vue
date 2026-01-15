<template>
  <div class="space-y-4">
    <!-- Header: Team Name -->
    <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Team Definition</label>
        <div class="block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500 shadow-sm cursor-not-allowed select-none">
            {{ teamDefinition.name }}
        </div>
    </div>

    <!-- Default Model Selection -->
    <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Default LLM Model (Global)</label>
        <SearchableGroupedSelect
            :model-value="config.llmModelIdentifier"
            @update:modelValue="updateModel"
            :options="groupedModelOptions"
            :disabled="config.isLocked || !llmStore.providersWithModels.length"
            placeholder="Select a model..."
            search-placeholder="Search models..."
        />
        <p class="mt-1 text-xs text-gray-500">This model will be used by all members unless overridden.</p>
    </div>

    <!-- Workspace Config -->
    <WorkspacePathInput
        :model-value="currentPath" 
        @update:modelValue="handleWorkspacePathUpdate"
        :is-loading="workspaceLoadingState.isLoading"
        :error="workspaceLoadingState.error"
        :is-loaded="!!workspaceLoadingState.loadedPath"
        :disabled="config.isLocked"
    />
    
    <!-- Auto Execute -->
    <div class="flex items-center">
        <input
            id="team-auto-execute"
            type="checkbox"
            :checked="config.autoExecuteTools"
            @change="updateAutoExecute(($event.target as HTMLInputElement).checked)"
            :disabled="config.isLocked"
            class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
        />
        <label for="team-auto-execute" class="ml-2 block text-sm text-gray-700 select-none" :class="{ 'text-gray-400': config.isLocked }">
            Auto approve tools
        </label>
    </div>

    <!-- Team Members Override Section (Collapsible) -->
    <div v-if="teamDefinition.nodes.length > 0" class="mt-4">
        <button
            type="button"
            @click="overridesExpanded = !overridesExpanded"
            class="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors w-full text-left"
            :disabled="config.isLocked"
        >
            <span 
                class="mr-1 transition-transform duration-200"
                :class="overridesExpanded ? 'rotate-90' : ''"
            >
                <span class="i-heroicons-chevron-right-20-solid w-4 h-4"></span>
            </span>
            Team Members Override ({{ teamDefinition.nodes.length }})
        </button>
        
        <div v-show="overridesExpanded" class="mt-3 space-y-2">
            <MemberOverrideItem
                v-for="node in teamDefinition.nodes"
                :key="node.memberName"
                :member-name="node.memberName"
                :agent-definition-id="node.referenceId"
                :override="config.memberOverrides[node.memberName]"
                :options="groupedModelOptions"
                :is-coordinator="node.memberName === teamDefinition.coordinatorMemberName"
                :disabled="config.isLocked"
                @update:override="handleOverrideUpdate"
            />
        </div>
    </div>

    <div v-if="config.isLocked" class="flex items-center text-xs text-amber-600 bg-amber-50 p-2 rounded">
        <span class="i-heroicons-lock-closed-20-solid w-4 h-4 mr-1"></span>
        <span>Configuration locked because execution has started.</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useLLMProviderConfigStore } from '~/stores/llmProviderConfig';
import type { TeamRunConfig, MemberConfigOverride } from '~/types/agent/TeamRunConfig';
import type { AgentTeamDefinition } from '~/stores/agentTeamDefinitionStore';
import WorkspacePathInput from './WorkspacePathInput.vue';
import MemberOverrideItem from './MemberOverrideItem.vue';
import SearchableGroupedSelect, { type GroupedOption } from '~/components/agentTeams/SearchableGroupedSelect.vue';

interface WorkspaceLoadingState {
  isLoading: boolean;
  error: string | null;
  loadedPath: string | null;
}

const props = defineProps<{
  config: TeamRunConfig | any;
  teamDefinition: AgentTeamDefinition;
  workspaceLoadingState: WorkspaceLoadingState;
  initialPath?: string;
}>();

const emit = defineEmits<{
  (e: 'update:workspacePath', path: string): void;
}>();

const llmStore = useLLMProviderConfigStore();
const currentPath = ref(props.initialPath || '');
const overridesExpanded = ref(true);

const overrideCount = computed(() => 
  Object.keys(props.config.memberOverrides || {}).length
);

watch(() => props.workspaceLoadingState.loadedPath, (newPath) => {
    if (newPath) {
        currentPath.value = newPath;
    }
});

onMounted(() => {
  if (llmStore.providersWithModels.length === 0) {
    llmStore.fetchProvidersWithModels();
  }
});

const groupedModelOptions = computed<GroupedOption[]>(() => {
    return llmStore.providersWithModels.map(provider => ({
        label: provider.provider,
        items: provider.models.map(model => ({
            id: model.modelIdentifier,
            name: model.name
        }))
    }));
});

const updateModel = (value: string) => {
    props.config.llmModelIdentifier = value;
};

const updateAutoExecute = (checked: boolean) => {
    props.config.autoExecuteTools = checked;
};

const handleWorkspacePathUpdate = (path: string) => {
    currentPath.value = path;
    emit('update:workspacePath', path);
};

const handleOverrideUpdate = (memberName: string, override: MemberConfigOverride | null) => {
  if (!props.config.memberOverrides) {
    props.config.memberOverrides = {};
  }
  if (override) {
    props.config.memberOverrides[memberName] = override;
  } else {
    delete props.config.memberOverrides[memberName];
  }
};
</script>
