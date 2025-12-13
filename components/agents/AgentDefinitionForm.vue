<template>
  <form @submit.prevent="handleSubmit" class="space-y-8 bg-white p-8 rounded-lg shadow-md border border-gray-200">
    <!-- Basic Info -->
    <fieldset class="space-y-6">
      <div>
        <label for="name" class="block text-base font-medium text-gray-800">Name</label>
        <input
          type="text"
          id="name"
          v-model="formData.name"
          required
          class="mt-2 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base"
          placeholder="e.g., Software Developer Agent"
        />
      </div>

      <div>
        <label for="role" class="block text-base font-medium text-gray-800">Role</label>
        <input
          type="text"
          id="role"
          v-model="formData.role"
          required
          class="mt-2 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base"
          placeholder="e.g., Senior Software Developer"
        />
      </div>

      <div>
        <label for="description" class="block text-base font-medium text-gray-800">Description</label>
        <textarea
          id="description"
          v-model="formData.description"
          required
          rows="4"
          class="mt-2 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base"
          placeholder="A detailed description of the agent's purpose and capabilities."
        ></textarea>
      </div>
    </fieldset>

    <!-- System Prompt Selection -->
    <fieldset class="border-t border-gray-200 pt-8">
      <legend class="text-xl font-semibold text-gray-900">System Prompt</legend>
      <div class="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-6">
        <div>
          <label for="prompt-category" class="block text-base font-medium text-gray-800">Prompt Category</label>
          <select
            id="prompt-category"
            v-model="formData.system_prompt_category"
            class="mt-2 block w-full pl-3 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
          >
            <option value="" disabled>Select a Prompt Category</option>
            <option v-for="category in optionsStore.promptCategories" :key="category.category" :value="category.category">
              {{ category.category }}
            </option>
          </select>
        </div>
        <div>
          <label for="prompt-name" class="block text-base font-medium text-gray-800">Prompt Name</label>
          <select
            id="prompt-name"
            v-model="formData.system_prompt_name"
            :disabled="!formData.system_prompt_category"
            class="mt-2 block w-full pl-3 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md disabled:bg-gray-100"
          >
            <option value="" disabled>{{ formData.system_prompt_category ? 'Select a name' : 'Select a category first' }}</option>
            <option v-for="name in availablePromptNames" :key="name" :value="name">
              {{ name }}
            </option>
          </select>
        </div>
      </div>
    </fieldset>

    <!-- Tool Configuration -->
    <fieldset class="border-t border-gray-200 pt-8">
      <legend class="text-xl font-semibold text-gray-900">Tool Configuration</legend>
      <div class="mt-4 grid grid-cols-1 gap-x-8 gap-y-8">
        <div>
          <label for="tool_names" class="block text-base font-medium text-gray-800">Tools</label>
          <p class="text-sm text-gray-500 mb-2">Select available tools for the agent to use.</p>
          <GroupableTagInput
            :model-value="formData['tool_names']"
            @update:model-value="formData['tool_names'] = $event"
            :source="getComponentSource('tool_names')"
            placeholder="Add tools..."
            :loading="toolStore.loading"
            @add-all="handleAddAllTools"
          />
        </div>
      </div>
    </fieldset>

    <!-- Advanced Settings -->
    <details class="border-t border-gray-200 pt-8">
      <summary class="text-xl font-semibold text-gray-900 cursor-pointer">Advanced Settings</summary>
      <p class="text-sm text-gray-500 mt-2 mb-4">
        The following components are pre-selected with sensible defaults. Modify them only if you need to customize the agent's core behavior. Mandatory components are locked.
      </p>
      <fieldset class="mt-4 space-y-8">
        <div v-for="field in componentFields.filter(f => f.name !== 'tool_names')" :key="field.name">
          <div class="flex justify-between items-baseline mb-1">
            <label :for="field.name" class="block text-base font-medium text-gray-800">{{ field.label }}</label>
            <button
              type="button"
              @click="resetToDefaults(field.name)"
              class="text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-md px-2 py-1 -my-1"
            >
              Reset to Defaults
            </button>
          </div>
          <p class="text-sm text-gray-500 mb-2">{{ field.helpText }}</p>
          <GroupableTagInput
            :model-value="formData[field.name]"
            @update:model-value="formData[field.name] = $event"
            :source="getComponentSource(field.name)"
            :placeholder="field.placeholder"
          />
        </div>
      </fieldset>
    </details>

    <div class="flex justify-end pt-4 space-x-4">
      <button
        type="button"
        @click="$emit('cancel')"
        class="inline-flex justify-center py-3 px-6 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Cancel
      </button>
      <button
        type="submit"
        :disabled="isSubmitting"
        class="inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        <span v-if="isSubmitting" class="animate-spin h-5 w-5 mr-3 i-heroicons-arrow-path-20-solid" viewBox="0 0 24 24"></span>
        {{ submitButtonText }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { reactive, watch, toRefs, computed, onMounted } from 'vue';
import { useAgentDefinitionOptionsStore } from '~/stores/agentDefinitionOptionsStore';
import { useToolManagementStore } from '~/stores/toolManagementStore';
import GroupableTagInput from '~/components/agents/GroupableTagInput.vue';
import type { GroupedSource, FlatSource } from '~/components/agents/GroupableTagInput.vue';
import type { ProcessorOption } from '~/stores/agentDefinitionOptionsStore';

const props = defineProps<{
  initialData?: any;
  isSubmitting: boolean;
  submitButtonText: string;
  isCreateMode: boolean;
}>();

const emit = defineEmits(['submit', 'cancel']);
const { initialData, isCreateMode } = toRefs(props);

// Stores
const optionsStore = useAgentDefinitionOptionsStore();
const toolStore = useToolManagementStore();

// Fetch required data on mount
onMounted(async () => {
  optionsStore.fetchAllAvailableOptions();
  if (toolStore.getLocalToolsByCategory.length === 0) {
    toolStore.fetchLocalToolsGroupedByCategory();
  }
  if (toolStore.getMcpServers.length === 0) {
    await toolStore.fetchMcpServers();
  }
  toolStore.getMcpServers.forEach(server => {
    if (toolStore.getToolsForServer(server.serverId).length === 0) {
      toolStore.fetchToolsForServer(server.serverId);
    }
  });
});

const componentFields = computed(() => [
  { name: 'tool_names', camelCase: 'toolNames', label: 'Tools', placeholder: 'Add custom tools...', helpText: 'Select available tools for the agent to use.' },
  { name: 'input_processor_names', camelCase: 'inputProcessorNames', label: 'Input Processors', placeholder: 'Add custom processors...', helpText: 'Customize processors that handle incoming messages.' },
  { name: 'llm_response_processor_names', camelCase: 'llmResponseProcessorNames', label: 'LLM Response Processors', placeholder: 'Add custom processors...', helpText: 'Customize processors that interpret LLM responses.' },
  { name: 'system_prompt_processor_names', camelCase: 'systemPromptProcessorNames', label: 'System Prompt Processors', placeholder: 'Add custom processors...', helpText: 'Customize processors that build the system prompt.' },
  { name: 'tool_execution_result_processor_names', camelCase: 'toolExecutionResultProcessorNames', label: 'Tool Result Processors', placeholder: 'Add custom processors...', helpText: 'Customize processors that handle tool results.' },
  { name: 'tool_invocation_preprocessor_names', camelCase: 'toolInvocationPreprocessorNames', label: 'Tool Invocation Preprocessors', placeholder: 'Add preprocessors...', helpText: 'Run before a tool executes (e.g., resolve media paths).' },
  { name: 'phase_hook_names', camelCase: 'phaseHookNames', label: 'Phase Hooks', placeholder: 'Add custom hooks...', helpText: 'Customize hooks that trigger on agent phase changes.' },
]);

const toolSource = computed((): GroupedSource => {
  const localToolGroups = toolStore.getLocalToolsByCategory.map(group => ({
    name: group.categoryName,
    tags: group.tools.map(t => ({ name: t.name, isMandatory: false })), // Tools are never mandatory in this context
    allowAll: true,
  }));
  const mcpServerGroups = toolStore.getMcpServers.map(server => ({
    name: `MCP: ${server.serverId}`,
    tags: toolStore.getToolsForServer(server.serverId).map(t => ({ name: t.name, isMandatory: false })),
    allowAll: true,
  }));
  return { type: 'grouped', groups: [...localToolGroups, ...mcpServerGroups] };
});

const getComponentSource = (fieldName: string): GroupedSource | FlatSource => {
  if (fieldName === 'tool_names') {
    return toolSource.value;
  }
  const storeKeyMap: { [key: string]: keyof typeof optionsStore } = {
    'input_processor_names': 'inputProcessors',
    'llm_response_processor_names': 'llmResponseProcessors',
    'system_prompt_processor_names': 'systemPromptProcessors',
    'tool_execution_result_processor_names': 'toolExecutionResultProcessors',
    'tool_invocation_preprocessor_names': 'toolInvocationPreprocessors',
    'phase_hook_names': 'phaseHooks',
  };
  const key = storeKeyMap[fieldName];
  const tags = optionsStore[key] as ProcessorOption[] | undefined;
  return {
    type: 'flat',
    tags: tags || []
  };
};

const getInitialValue = (): { [key: string]: any } => ({
  name: '',
  role: '',
  description: '',
  system_prompt_category: '',
  system_prompt_name: '',
  ...Object.fromEntries(componentFields.value.map(f => [f.name, [] as string[]]))
});

const formData = reactive(getInitialValue());

watch(initialData, (newData) => {
  if (newData && !isCreateMode.value) {
    formData.name = newData.name || '';
    formData.role = newData.role || '';
    formData.description = newData.description || '';
    formData.system_prompt_category = newData.systemPromptCategory || '';
    formData.system_prompt_name = newData.systemPromptName || '';
    componentFields.value.forEach(field => {
      const key = field.name as keyof typeof formData;
      formData[key] = newData[field.camelCase] || newData[key] || [];
    });
  } else {
    Object.assign(formData, getInitialValue());
  }
}, { immediate: true, deep: true });

// New logic for defaulting processors in create mode
watch(() => optionsStore.loading, (isLoading) => {
  if (!isLoading && isCreateMode.value) {
    if (formData.input_processor_names.length === 0) {
      formData.input_processor_names = optionsStore.inputProcessors.filter(p => p.isMandatory).map(p => p.name);
    }
    if (formData.llm_response_processor_names.length === 0) {
      formData.llm_response_processor_names = optionsStore.llmResponseProcessors.filter(p => p.isMandatory).map(p => p.name);
    }
    if (formData.system_prompt_processor_names.length === 0) {
      formData.system_prompt_processor_names = optionsStore.systemPromptProcessors.filter(p => p.isMandatory).map(p => p.name);
    }
    if (formData.tool_execution_result_processor_names.length === 0) {
      formData.tool_execution_result_processor_names = optionsStore.toolExecutionResultProcessors.filter(p => p.isMandatory).map(p => p.name);
    }
    if (formData.tool_invocation_preprocessor_names.length === 0) {
      formData.tool_invocation_preprocessor_names = optionsStore.toolInvocationPreprocessors.filter(p => p.isMandatory).map(p => p.name);
    }
    if (formData.phase_hook_names.length === 0) {
      formData.phase_hook_names = optionsStore.phaseHooks.filter(p => p.isMandatory).map(p => p.name);
    }
  }
});

const availablePromptNames = computed(() => {
  if (!formData.system_prompt_category) return [];
  const selectedCat = optionsStore.promptCategories.find(c => c.category === formData.system_prompt_category);
  return selectedCat ? selectedCat.names : [];
});

watch(() => formData.system_prompt_category, () => {
  formData.system_prompt_name = '';
});

function handleAddAllTools(groupName: string) {
  let toolsToAdd: string[] = [];
  const mcpPrefix = 'MCP: ';
  if (groupName.startsWith(mcpPrefix)) {
    const serverId = groupName.substring(mcpPrefix.length);
    toolsToAdd = toolStore.getToolsForServer(serverId).map(t => t.name);
  } else {
    const categoryGroup = toolStore.getLocalToolsByCategory.find(g => g.categoryName === groupName);
    if (categoryGroup) {
      toolsToAdd = categoryGroup.tools.map(t => t.name);
    }
  }
  const currentTools = formData.tool_names;
  const newToolSet = new Set([...currentTools, ...toolsToAdd]);
  formData.tool_names = Array.from(newToolSet);
}

// NEW: Reset to defaults function
function resetToDefaults(fieldName: string) {
  const storeKeyMap: { [key: string]: keyof typeof optionsStore } = {
    'input_processor_names': 'inputProcessors',
    'llm_response_processor_names': 'llmResponseProcessors',
    'system_prompt_processor_names': 'systemPromptProcessors',
    'tool_execution_result_processor_names': 'toolExecutionResultProcessors',
    'tool_invocation_preprocessor_names': 'toolInvocationPreprocessors',
    'phase_hook_names': 'phaseHooks',
  };
  const key = storeKeyMap[fieldName];
  if (!key) return;

  const defaultOptions = optionsStore[key] as ProcessorOption[] | undefined;
  if (defaultOptions) {
    // This directly replaces the current list with the default list of names.
    (formData as any)[fieldName] = defaultOptions.filter(p => p.isMandatory).map(p => p.name);
  }
}

const handleSubmit = () => {
  const submissionData = {
    name: formData.name,
    role: formData.role,
    description: formData.description,
    systemPromptCategory: formData.system_prompt_category,
    systemPromptName: formData.system_prompt_name,
    toolNames: formData.tool_names,
    inputProcessorNames: formData.input_processor_names,
    llmResponseProcessorNames: formData.llm_response_processor_names,
    systemPromptProcessorNames: formData.system_prompt_processor_names,
    toolExecutionResultProcessorNames: formData.tool_execution_result_processor_names,
    toolInvocationPreprocessorNames: formData.tool_invocation_preprocessor_names,
    phaseHookNames: formData.phase_hook_names,
  };
  emit('submit', submissionData);
};
</script>
