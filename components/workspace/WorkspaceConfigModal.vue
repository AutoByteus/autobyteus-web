<template>
  <div class="fixed inset-0 overflow-y-auto z-50 bg-gray-500 bg-opacity-75 transition-opacity">
    <div class="flex items-center justify-center min-h-screen">
      <div class="bg-white rounded-lg shadow-xl transform transition-all sm:max-w-2xl sm:w-full m-4">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg leading-6 font-medium text-gray-900">Configure Workspace</h3>
          <p class="mt-1 text-sm text-gray-500">Set up a workspace to run the agent '{{ agentName }}'.</p>
        </div>
        <form @submit.prevent="handleSubmit">
          <div class="px-6 py-5 space-y-6 max-h-[70vh] overflow-y-auto">
            
            <!-- Config Mode Selector -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Workspace Setup *</label>
              <div class="space-y-3">
                
                <!-- Option: Use Existing -->
                <div
                  @click="existingWorkspaces.length > 0 ? configMode = 'existing' : null"
                  :class="[
                    'p-4 border rounded-lg transition-all duration-150',
                    configMode === 'existing'
                      ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500'
                      : 'bg-gray-50 border-gray-300',
                    existingWorkspaces.length > 0 
                      ? 'cursor-pointer hover:bg-gray-100 hover:border-gray-400' 
                      : 'cursor-not-allowed bg-gray-100 opacity-60'
                  ]"
                >
                  <h4 class="font-semibold text-gray-800">Use an Existing Workspace</h4>
                  <p class="text-sm text-gray-600 mt-1">Attach to a running workspace session.</p>
                  <p v-if="existingWorkspaces.length === 0" class="text-xs text-gray-500 mt-1 italic">No active workspaces available.</p>
                </div>

                <!-- Option: Create New -->
                <div
                  @click="configMode = 'new'"
                  :class="[
                    'p-4 border rounded-lg cursor-pointer transition-all duration-150',
                    configMode === 'new'
                      ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500'
                      : 'bg-gray-50 border-gray-300 hover:bg-gray-100 hover:border-gray-400'
                  ]"
                >
                  <h4 class="font-semibold text-gray-800">Create a New Workspace</h4>
                  <p class="text-sm text-gray-600 mt-1">Set up a fresh, isolated workspace environment.</p>
                </div>

                <!-- Option: No Workspace -->
                <div
                  @click="configMode = 'none'"
                  :class="[
                    'p-4 border rounded-lg cursor-pointer transition-all duration-150',
                    configMode === 'none'
                      ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500'
                      : 'bg-gray-50 border-gray-300 hover:bg-gray-100 hover:border-gray-400'
                  ]"
                >
                  <h4 class="font-semibold text-gray-800">No Workspace</h4>
                  <p class="text-sm text-gray-600 mt-1">Run the agent without a file system or pre-configured environment.</p>
                </div>
              </div>
            </div>

            <!-- Conditional Details -->
            <div class="space-y-4 pt-4 border-t border-gray-200">
                <!-- Details for 'existing' mode -->
                <div v-if="configMode === 'existing'" class="space-y-4">
                  <label class="block text-sm font-medium text-gray-700">Select Workspace <span class="text-red-500">*</span></label>
                  <div class="space-y-3 max-h-60 overflow-y-auto pr-2">
                    <label
                      v-for="ws in existingWorkspaces"
                      :key="ws.workspaceId"
                      :class="[
                        'p-4 border rounded-lg cursor-pointer transition-all duration-150 flex items-start space-x-4',
                        selectedExistingWorkspaceId === ws.workspaceId
                          ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500'
                          : 'border-gray-200 bg-white hover:border-indigo-400 hover:shadow-sm'
                      ]"
                    >
                      <input 
                        type="radio"
                        :value="ws.workspaceId"
                        v-model="selectedExistingWorkspaceId"
                        class="form-radio h-5 w-5 text-indigo-600 border-gray-300 focus:ring-indigo-500 mt-0.5"
                      />
                      <div class="flex-1">
                        <p class="font-semibold text-gray-800">{{ ws.name }}</p>
                        <p class="text-sm text-gray-500 mt-1">Type: <span class="font-mono">{{ ws.workspaceTypeName }}</span></p>
                        <p class="text-xs text-gray-500 mt-1">ID: <span class="font-mono">{{ ws.workspaceId }}</span></p>
                      </div>
                    </label>
                  </div>
                </div>

                <!-- Details for 'new' mode -->
                <div v-if="configMode === 'new'" class="space-y-4">
                  <label class="block text-sm font-medium text-gray-700">Available Workspace Types</label>
                   <div class="space-y-3">
                     <div
                        v-for="type in workspaceStore.availableWorkspaceTypes"
                        :key="type.name"
                        @click="selectedNewWorkspaceType = type.name"
                        :class="[
                          'p-4 border rounded-lg cursor-pointer transition-all duration-150',
                          selectedNewWorkspaceType === type.name
                            ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500'
                            : 'bg-gray-50 border-gray-300 hover:bg-gray-100 hover:border-gray-400'
                        ]"
                      >
                        <h4 class="font-semibold text-gray-800">{{ type.name }}</h4>
                        <p class="text-sm text-gray-600 mt-1">{{ type.description }}</p>
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
                </div>
            </div>

             <div v-if="workspaceStore.loading && configMode === 'new'" class="text-center">
                Loading configuration...
             </div>
             <div v-if="error" class="text-red-500 text-sm p-2 bg-red-50 rounded-md">
                {{ error }}
             </div>
          </div>
          <div class="bg-gray-50 px-6 py-3 sm:flex sm:flex-row-reverse">
            <button 
              type="submit"
              :disabled="isSubmitDisabled"
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
import { useWorkspaceStore } from '~/stores/workspace';
import { useAgentSessionStore } from '~/stores/agentSessionStore';
import { useAgentDefinitionStore } from '~/stores/agentDefinitionStore';

const props = defineProps<{  agentDefinitionId: string;
  agentName: string;
}>();

const emit = defineEmits(['close', 'success']);

const workspaceStore = useWorkspaceStore();
const agentSessionStore = useAgentSessionStore();
const agentDefinitionStore = useAgentDefinitionStore();

const configMode = ref<'new' | 'existing' | 'none' | null>(null);
const selectedNewWorkspaceType = ref('');
const selectedExistingWorkspaceId = ref('');
const formData = ref<Record<string, any>>({});
const error = ref<string | null>(null);

const existingWorkspaces = computed(() => Object.values(workspaceStore.workspaces));

const isSubmitDisabled = computed(() => {
    if (workspaceStore.loading) return true;
    if (!configMode.value) return true;
    if (configMode.value === 'existing' && !selectedExistingWorkspaceId.value) return true;
    if (configMode.value === 'new' && !selectedNewWorkspaceType.value) return true;
    return false;
});

onMounted(async () => {
  await workspaceStore.fetchAvailableWorkspaceTypes();
  if (existingWorkspaces.value.length > 0) {
    configMode.value = 'existing';
  } else {
    configMode.value = 'new';
  }
});

const selectedSchema = computed(() => {
  if (configMode.value !== 'new' || !selectedNewWorkspaceType.value) return null;
  return workspaceStore.availableWorkspaceTypes.find(t => t.name === selectedNewWorkspaceType.value)?.config_schema;
});

watch(selectedNewWorkspaceType, (newType) => {
  const schema = workspaceStore.availableWorkspaceTypes.find(t => t.name === newType)?.config_schema;
  formData.value = {};
  if (schema) {
    for (const param of schema.parameters) {
      formData.value[param.name] = param.default_value ?? '';
    }
  }
});

watch(configMode, (newMode) => {
    // Clear selections when switching modes
    if (newMode !== 'new') selectedNewWorkspaceType.value = '';
    if (newMode !== 'existing') selectedExistingWorkspaceId.value = '';
    error.value = null;
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
  if (!configMode.value) {
    error.value = "Please select a workspace configuration option.";
    return;
  }
  
  try {
    const agentDef = agentDefinitionStore.getAgentDefinitionById(props.agentDefinitionId);
    if (!agentDef) {
      throw new Error("Could not find agent definition to create session.");
    }
    
    let workspaceId: string | null = null;
    let workspaceName: string = '';
    let workspaceTypeName: string = '';
    let workspaceConfig: any = {};

    switch (configMode.value) {
      case 'existing':
        if (!selectedExistingWorkspaceId.value) {
            error.value = "Please select an existing workspace.";
            return;
        }
        const existingWs = workspaceStore.workspaces[selectedExistingWorkspaceId.value];
        workspaceId = existingWs.workspaceId;
        workspaceName = existingWs.name;
        workspaceTypeName = existingWs.workspaceTypeName;
        workspaceConfig = existingWs.workspaceConfig;
        break;

      case 'new':
        if (!selectedNewWorkspaceType.value) {
            error.value = "Please select a workspace type to create.";
            return;
        }
        workspaceTypeName = selectedNewWorkspaceType.value;
        workspaceConfig = formData.value;

        // Create workspace
        workspaceId = await workspaceStore.createWorkspace(workspaceTypeName, workspaceConfig);
        const workspaceInfo = workspaceStore.workspaces[workspaceId];
        if (workspaceInfo) {
          workspaceName = workspaceInfo.name;
        }
        break;

      case 'none':
        workspaceId = null;
        workspaceName = 'No Workspace';
        workspaceTypeName = 'No Workspace';
        workspaceConfig = {};
        break;
    }
    
    // Create agent session
    const newSession = agentSessionStore.createSession(
      agentDef,
      workspaceId,
      workspaceName,
      workspaceTypeName,
      workspaceConfig
    );
    agentSessionStore.setActiveSession(newSession.sessionId);
    
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
