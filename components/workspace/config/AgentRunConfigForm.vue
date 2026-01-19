<template>
  <div class="space-y-4">
    <!-- Header: Agent Name -->
    <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Agent Definition</label>
        <div class="block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500 shadow-sm cursor-not-allowed select-none">
            {{ agentDefinition.name }}
        </div>
    </div>

    <!-- Model Selection -->
    <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">LLM Model</label>
        <SearchableGroupedSelect
            :model-value="config.llmModelIdentifier"
            @update:modelValue="updateModel"
            :options="groupedModelOptions"
            :disabled="config.isLocked || !llmStore.providersWithModels.length"
            placeholder="Select a model..."
            search-placeholder="Search models..."
        />
    </div>

    <ModelConfigSection
        :schema="modelConfigSchema"
        :model-config="config.llmConfig"
        :disabled="config.isLocked"
        :apply-defaults="true"
        :clear-on-empty-schema="true"
        @update:config="updateModelConfig"
    />

    <!-- Workspace Selector -->
    <WorkspaceSelector
        :workspace-id="config.workspaceId"
        :is-loading="workspaceLoadingState.isLoading"
        :error="workspaceLoadingState.error"
        :disabled="config.isLocked"
        @select-existing="handleSelectExisting"
        @load-new="handleLoadNew"
    />
    
    <!-- Auto Execute -->
    <div class="flex items-center">
        <input
            id="auto-execute"
            type="checkbox"
            :checked="config.autoExecuteTools"
            @change="updateAutoExecute(($event.target as HTMLInputElement).checked)"
            :disabled="config.isLocked"
            class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
        />
        <label for="auto-execute" class="ml-2 block text-sm text-gray-700 select-none" :class="{ 'text-gray-400': config.isLocked }">
            Auto approve tools
        </label>
    </div>

    <div v-if="config.isLocked" class="flex items-center text-xs text-amber-600 bg-amber-50 p-2 rounded">
        <span class="i-heroicons-lock-closed-20-solid w-4 h-4 mr-1"></span>
        <span>Configuration locked because execution has started.</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useLLMProviderConfigStore } from '~/stores/llmProviderConfig';
import type { AgentRunConfig } from '~/types/agent/AgentRunConfig';
import type { AgentDefinition } from '~/stores/agentDefinitionStore';
import WorkspaceSelector from './WorkspaceSelector.vue';
import SearchableGroupedSelect, { type GroupedOption } from '~/components/agentTeams/SearchableGroupedSelect.vue';
import ModelConfigSection from './ModelConfigSection.vue';

interface WorkspaceLoadingState {
  isLoading: boolean;
  error: string | null;
  loadedPath: string | null;
}

const props = defineProps<{
  config: AgentRunConfig | any;
  agentDefinition: AgentDefinition;
  workspaceLoadingState: WorkspaceLoadingState;
  initialPath?: string;
}>();

const emit = defineEmits<{
  (e: 'select-existing', workspaceId: string): void;
  (e: 'load-new', path: string): void;
}>();

const llmStore = useLLMProviderConfigStore();

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
            name: model.modelIdentifier
        }))
    }));
});

const modelConfigSchema = computed(() => {
    if (!props.config.llmModelIdentifier) return null;
    return llmStore.modelConfigSchemaByIdentifier(props.config.llmModelIdentifier);
});

const updateModel = (value: string) => {
    props.config.llmModelIdentifier = value;
};

const updateModelConfig = (config: Record<string, unknown> | null) => {
    props.config.llmConfig = config;
};

const updateAutoExecute = (checked: boolean) => {
    props.config.autoExecuteTools = checked;
};

const handleSelectExisting = (workspaceId: string) => {
    emit('select-existing', workspaceId);
};

const handleLoadNew = (path: string) => {
    emit('load-new', path);
};
</script>
