<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200">
    <!-- Header -->
    <div class="p-6 border-b flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">{{ isEditMode ? 'Edit' : 'Add' }} MCP Server</h2>
        <p class="text-base text-gray-500 mt-1">Configure a connection to a remote tool server.</p>
      </div>
      <button @click="cancel" class="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-base">Cancel</button>
    </div>

    <!-- Form Content -->
    <div class="p-6 space-y-6">
      <!-- Common Fields -->
      <div>
        <label for="serverId" class="block text-base font-medium text-gray-700">Server ID</label>
        <input type="text" v-model="form.serverId" id="serverId" :disabled="isEditMode"
               class="mt-1 block w-full shadow-sm text-base border-gray-300 rounded-md disabled:bg-gray-100 p-2">
      </div>

      <div>
        <label for="transportType" class="block text-base font-medium text-gray-700">Transport Type</label>
        <select v-model="form.transportType" id="transportType"
                class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md">
          <option>STDIO</option>
          <option>STREAMABLE_HTTP</option>
        </select>
      </div>

      <div>
        <label for="toolNamePrefix" class="block text-base font-medium text-gray-700">Tool Name Prefix (Optional)</label>
        <input type="text" v-model="form.toolNamePrefix" id="toolNamePrefix"
               class="mt-1 block w-full shadow-sm text-base border-gray-300 rounded-md p-2">
      </div>

      <div class="flex items-center">
        <input id="enabled" v-model="form.enabled" type="checkbox" class="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
        <label for="enabled" class="ml-3 block text-base text-gray-900">Enable this server on save</label>
      </div>

      <div class="relative">
        <div class="absolute inset-0 flex items-center" aria-hidden="true">
          <div class="w-full border-t border-gray-300"></div>
        </div>
        <div class="relative flex justify-center">
          <span class="px-3 bg-white text-base text-gray-500">{{ form.transportType }} Config</span>
        </div>
      </div>
      
      <!-- STDIO Config -->
      <div v-if="form.transportType === 'STDIO'" class="space-y-4 p-4 border rounded-md bg-gray-50">
        <div>
          <label for="stdio_command" class="block text-base font-medium text-gray-700">Command</label>
          <input type="text" v-model="form.stdioConfig.command" id="stdio_command" class="mt-1 block w-full shadow-sm text-base border-gray-300 rounded-md p-2">
        </div>
        <div>
          <label class="block text-base font-medium text-gray-700">Arguments</label>
           <div class="space-y-2 mt-1">
            <div v-for="item in argList" :key="item.id" class="flex items-center space-x-2">
              <input type="text" v-model="item.value" placeholder="Argument" class="block w-full shadow-sm text-base border-gray-300 rounded-md p-2">
              <button @click="removeArgument(item.id)" class="p-2 text-gray-500 hover:text-red-600 rounded-full">
                <span class="i-heroicons-trash-20-solid w-5 h-5"></span>
              </button>
            </div>
          </div>
          <button @click="addArgument" class="mt-2 inline-flex items-center px-3 py-1.5 border border-dashed border-gray-400 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            <span class="i-heroicons-plus-20-solid w-5 h-5 mr-1 text-gray-500"></span>
            Add Argument
          </button>
        </div>
        <div>
          <label for="stdio_cwd" class="block text-base font-medium text-gray-700">Current Working Directory (Optional)</label>
          <input type="text" v-model="form.stdioConfig.cwd" id="stdio_cwd" class="mt-1 block w-full shadow-sm text-base border-gray-300 rounded-md p-2">
        </div>
        <div>
          <label class="block text-base font-medium text-gray-700">Environment Variables</label>
          <div class="space-y-2 mt-1">
            <div v-for="item in envList" :key="item.id" class="flex items-center space-x-2">
              <input type="text" v-model="item.key" placeholder="KEY" class="block w-full shadow-sm text-base border-gray-300 rounded-md p-2 font-mono">
              <span class="text-gray-500">=</span>
              <input type="text" v-model="item.value" placeholder="Value" class="block w-full shadow-sm text-base border-gray-300 rounded-md p-2">
              <button @click="removeEnvVariable(item.id)" class="p-2 text-gray-500 hover:text-red-600 rounded-full">
                <span class="i-heroicons-trash-20-solid w-5 h-5"></span>
              </button>
            </div>
          </div>
          <button @click="addEnvVariable" class="mt-2 inline-flex items-center px-3 py-1.5 border border-dashed border-gray-400 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            <span class="i-heroicons-plus-20-solid w-5 h-5 mr-1 text-gray-500"></span>
            Add Variable
          </button>
        </div>
      </div>

      <!-- HTTP Config -->
      <div v-if="form.transportType === 'STREAMABLE_HTTP'" class="space-y-4 p-4 border rounded-md bg-gray-50">
        <div>
          <label for="http_url" class="block text-base font-medium text-gray-700">URL</label>
          <input type="text" v-model="form.streamableHttpConfig.url" id="http_url" class="mt-1 block w-full shadow-sm text-base border-gray-300 rounded-md p-2">
        </div>
        <div>
          <label for="http_token" class="block text-base font-medium text-gray-700">Token (Optional)</label>
          <input type="password" v-model="form.streamableHttpConfig.token" id="http_token" class="mt-1 block w-full shadow-sm text-base border-gray-300 rounded-md p-2">
        </div>
      </div>

      <!-- Preview Results Section -->
      <div v-if="store.getPreviewResult" class="mt-4 p-4 rounded-md" :class="store.getPreviewResult.isError ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'">
         <h4 class="font-bold">{{ store.getPreviewResult.isError ? 'Error' : 'Discovered Tools' }}</h4>
         <p v-if="store.getPreviewResult.isError" class="text-base">{{ store.getPreviewResult.message }}</p>
         <div v-else-if="store.getPreviewResult.tools.length > 0" class="space-y-3 mt-2">
            <div v-for="tool in store.getPreviewResult.tools" :key="tool.name">
                <code class="font-mono text-sm font-semibold text-green-900">{{ tool.name }}</code>
                <p class="text-sm text-gray-600 pl-2">{{ tool.description }}</p>
            </div>
         </div>
         <p v-else class="text-base">No tools were discovered for this configuration.</p>
      </div>
    </div>
    
    <!-- Footer -->
    <div class="p-6 bg-gray-50 border-t flex justify-end">
      <div class="flex items-center space-x-4">
        <button @click="runPreview" :disabled="store.getLoading" class="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300 text-base font-semibold">
          <span v-if="store.getLoading" class="i-heroicons-arrow-path-20-solid w-5 h-5 animate-spin mr-2"></span>
          {{ store.getLoading ? 'Checking...' : 'Preview Tools' }}
        </button>
      
        <button @click="save" :disabled="store.getLoading" class="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 text-base font-semibold">
          <span v-if="store.getLoading" class="i-heroicons-arrow-path-20-solid w-5 h-5 animate-spin mr-2"></span>
          {{ store.getLoading ? 'Saving...' : 'Save Configuration' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, reactive, onUnmounted } from 'vue';
import { useToolManagementStore } from '~/stores/toolManagementStore';
import type { McpServer } from '~/stores/toolManagementStore';

type EnvItem = { id: number; key: string; value: string };
type ArgItem = { id: number; value: string };

const props = defineProps<{  server: McpServer | null;
}>();

const emit = defineEmits(['cancel', 'save']);

const store = useToolManagementStore();

const isEditMode = computed(() => !!props.server);

const createFreshForm = () => ({
  serverId: '',
  transportType: 'STDIO' as 'STDIO' | 'STREAMABLE_HTTP',
  toolNamePrefix: '',
  enabled: true,
  stdioConfig: {
    command: '',
    args: [] as string[],
    env: {} as Record<string, any>,
    cwd: '',
  },
  streamableHttpConfig: {
    url: '',
    token: '',
    headers: {},
  },
});

const form = reactive(createFreshForm());
const envList = ref<EnvItem[]>([]);
const argList = ref<ArgItem[]>([]);

// --- Environment Variables ---
const addEnvVariable = () => {
  envList.value.push({ id: Date.now(), key: '', value: '' });
};
const removeEnvVariable = (id: number) => {
  envList.value = envList.value.filter(item => item.id !== id);
};
watch(envList, (newList) => {
  const newEnv: Record<string, any> = {};
  newList.forEach(item => {
    if (item.key) {
      newEnv[item.key] = item.value;
    }
  });
  form.stdioConfig.env = newEnv;
}, { deep: true });

// --- Arguments ---
const addArgument = () => {
  argList.value.push({ id: Date.now(), value: '' });
};
const removeArgument = (id: number) => {
  argList.value = argList.value.filter(item => item.id !== id);
};
watch(argList, (newList) => {
  form.stdioConfig.args = newList.map(item => item.value).filter(item => item);
}, { deep: true });

// --- Lifecycle ---
watch(() => props.server, (newVal) => {
  store.clearPreviewResult();
  Object.assign(form, createFreshForm()); // Reset form
  envList.value = [];
  argList.value = [];

  if (newVal) {
    form.serverId = newVal.serverId;
    form.transportType = newVal.transportType;
    form.toolNamePrefix = newVal.toolNamePrefix || '';
    form.enabled = newVal.enabled;

    if (newVal.__typename === 'StdioMcpServerConfig') {
      form.stdioConfig.command = newVal.command || '';
      form.stdioConfig.cwd = newVal.cwd || '';
      
      // Populate args
      form.stdioConfig.args = newVal.args || [];
      if (newVal.args) {
        argList.value = newVal.args.map(arg => ({ id: Date.now() + Math.random(), value: arg }));
      }
      
      // Populate env
      form.stdioConfig.env = newVal.env || {};
      if (newVal.env) {
        envList.value = Object.entries(newVal.env).map(([key, value]) => ({
          id: Date.now() + Math.random(),
          key,
          value: String(value)
        }));
      }

    } else if (newVal.__typename === 'StreamableHttpMcpServerConfig') {
      form.streamableHttpConfig.url = newVal.url || '';
      form.streamableHttpConfig.token = newVal.token || '';
    }
  }
}, { immediate: true });

onUnmounted(() => {
    store.clearPreviewResult();
});

const buildInput = () => {
    const input: any = {
        serverId: form.serverId,
        transportType: form.transportType,
        toolNamePrefix: form.toolNamePrefix || null,
        enabled: form.enabled,
        stdioConfig: null,
        streamableHttpConfig: null,
    };
    if (form.transportType === 'STDIO') {
        input.stdioConfig = { 
          ...form.stdioConfig,
          cwd: form.stdioConfig.cwd || null,
        };
    } else if (form.transportType === 'STREAMABLE_HTTP') {
        input.streamableHttpConfig = {
          ...form.streamableHttpConfig,
          token: form.streamableHttpConfig.token || null,
        };
    }
    return input;
}

const runPreview = () => {
  if (form.serverId) {
    store.previewMcpServer(buildInput());
  } else {
    // A simple client-side validation message.
    store.$patch(state => {
        state.previewResult = {
            tools: [],
            isError: true,
            message: 'Server ID is required to run a preview.'
        }
    })
  }
};

const save = async () => {
  try {
    await store.configureMcpServer(buildInput());
    emit('save');
  } catch (e: any) {
    alert(`Failed to save server: ${e.message}`);
  }
};

const cancel = () => {
  emit('cancel');
};

</script>
