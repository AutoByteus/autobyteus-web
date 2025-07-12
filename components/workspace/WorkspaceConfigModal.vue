<template>
  <div class="fixed inset-0 overflow-y-auto z-50 bg-gray-500 bg-opacity-75 transition-opacity">
    <div class="flex items-center justify-center min-h-screen">
      <div class="bg-white rounded-lg shadow-xl transform transition-all sm:max-w-2xl sm:w-full m-4">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg leading-6 font-medium text-gray-900">Configure Workspace</h3>
          <p class="mt-1 text-sm text-gray-500">Set up a new workspace to run the agent '{{ agentName }}'.</p>
        </div>
        <form @submit.prevent="handleSubmit">
          <div class="px-6 py-5 space-y-6 max-h-[70vh] overflow-y-auto">
            <!-- Workspace Type Selector -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Workspace Type *</label>
              <div class="space-y-3">
                <div
                  v-for="type in workspaceOptions"
                  :key="type.name"
                  @click="selectedWorkspaceType = type.name"
                  :class="[
                    'p-4 border rounded-lg cursor-pointer transition-all duration-150',
                    selectedWorkspaceType === type.name
                      ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500'
                      : 'bg-gray-50 border-gray-300 hover:bg-gray-100 hover:border-gray-400'
                  ]"
                >
                  <h4 class="font-semibold text-gray-800">{{ type.name }}</h4>
                  <p class="text-sm text-gray-600 mt-1">{{ type.description }}</p>
                </div>
              </div>
            </div>

            <!-- Dynamic Form Fields -->
            <div v-if="selectedSchema" class="space-y-4 pt-4 border-t border-gray-200">
              <div v-for="param in selectedSchema.parameters" :key="param.name">
                <label :for="`param-${param.name}`" class="block text-sm font-medium text-gray-700">
                  {{ capitalize(param.name.replace(/_/g, ' ')) }}
                  <span v-if="param.required" class="text-red-500">*</span>
                </label>
                <input
                  :id="`param-${param.name}`"
                  :type="getHtmlInputType(param.param_type)"
                  :placeholder="param.description"
                  v-model="formData[param.name]"
                  :required="param.required"
                  class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                <p class="text-xs text-gray-500 mt-1">{{ param.description }}</p>
              </div>
            </div>
             <div v-if="workspaceStore.loading" class="text-center">
                Loading configuration...
             </div>
             <div v-if="error" class="text-red-500 text-sm p-2 bg-red-50 rounded-md">
                {{ error }}
             </div>
          </div>
          <div class="bg-gray-50 px-6 py-3 sm:flex sm:flex-row-reverse">
            <button 
              type="submit"
              :disabled="workspaceStore.loading || !selectedWorkspaceType"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              <span v-if="workspaceStore.loading" class="i-heroicons-arrow-path-20-solid w-5 h-5 mr-2 animate-spin"></span>
              {{ workspaceStore.loading ? 'Creating...' : 'Create and Run' }}
            </button>
            <button 
              type="button" 
              @click="$emit('close')"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useWorkspaceStore, type WorkspaceType } from '~/stores/workspace';
import { useAgentSessionStore } from '~/stores/agentSessionStore';
import { useAgentDefinitionStore } from '~/stores/agentDefinitionStore';

const props = defineProps<{  agentDefinitionId: string;
  agentName: string;
}>();

const emit = defineEmits(['close', 'success']);

const workspaceStore = useWorkspaceStore();
const agentSessionStore = useAgentSessionStore();
const agentDefinitionStore = useAgentDefinitionStore();

const selectedWorkspaceType = ref('');
const formData = ref<Record<string, any>>({});
const error = ref<string | null>(null);

const workspaceOptions = computed(() => {
  const noWorkspaceOption = {
    name: 'No Workspace',
    description: 'Run the agent without a file system or pre-configured environment.',
    config_schema: null,
  };
  return [noWorkspaceOption, ...workspaceStore.availableWorkspaceTypes];
});

onMounted(async () => {
  await workspaceStore.fetchAvailableWorkspaceTypes();
  if (workspaceStore.availableWorkspaceTypes.length === 0) {
    selectedWorkspaceType.value = 'No Workspace';
  }
});

const selectedSchema = computed(() => {
  if (selectedWorkspaceType.value === 'No Workspace') return null;
  return workspaceStore.availableWorkspaceTypes.find(t => t.name === selectedWorkspaceType.value)?.config_schema;
});

watch(selectedWorkspaceType, (newType) => {
  const schema = workspaceStore.availableWorkspaceTypes.find(t => t.name === newType)?.config_schema;
  formData.value = {};
  if (schema) {
    for (const param of schema.parameters) {
      formData.value[param.name] = param.default_value ?? '';
    }
  }
});

const getHtmlInputType = (paramType: string) => {
  switch(paramType) {
    case 'INTEGER': return 'number';
    case 'BOOLEAN': return 'checkbox';
    default: return 'text';
  }
};

const handleSubmit = async () => {
  error.value = null;
  if (!selectedWorkspaceType.value) {
    error.value = "Please select a workspace type.";
    return;
  }
  
  try {
    const agentDef = agentDefinitionStore.getAgentDefinitionById(props.agentDefinitionId);
    if (!agentDef) {
      throw new Error("Could not find agent definition to create session.");
    }
    
    let workspaceId = null;
    let workspaceName = 'No Workspace';

    if (selectedWorkspaceType.value !== 'No Workspace') {
      // Step 1: Create workspace if one is selected
      workspaceId = await workspaceStore.createWorkspace(selectedWorkspaceType.value, formData.value);
      const workspaceInfo = workspaceStore.workspaces[workspaceId];
      if (workspaceInfo) {
        workspaceName = workspaceInfo.name;
      }
    }
    
    // Step 2: Create agent session
    const newSession = agentSessionStore.createSession(
      agentDef,
      workspaceId,
      workspaceName,
      selectedWorkspaceType.value,
      formData.value
    );
    agentSessionStore.setActiveSession(newSession.sessionId);
    
    // Step 3: Emit success to parent
    emit('success');
  } catch (e: any) {
    console.error("Failed to create workspace and session:", e);
    error.value = e.message || "An unknown error occurred.";
  }
};

const capitalize = (value: string) => {
  if (!value) return '';
  value = value.toString();
  return value.charAt(0).toUpperCase() + value.slice(1);
};
</script>
