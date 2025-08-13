<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" @click.self="close">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
      <!-- Header -->
      <div class="p-6 border-b flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Bulk Import MCP Servers</h2>
          <p class="text-base text-gray-500 mt-1">Paste a JSON object to import multiple servers at once.</p>
        </div>
        <button @click="close" class="p-2 text-gray-500 hover:text-gray-800 rounded-full">
          <span class="i-heroicons-x-mark-20-solid w-6 h-6"></span>
        </button>
      </div>

      <!-- Content -->
      <div class="p-6 overflow-y-auto space-y-4">
        <div>
          <label for="bulk-json-input" class="block text-base font-medium text-gray-700">JSON Configuration</label>
          <p class="text-sm text-gray-500">The JSON must have a top-level `mcpServers` key containing an object of server configurations.</p>
          <textarea 
            id="bulk-json-input" 
            v-model="jsonString" 
            rows="15" 
            class="mt-2 font-mono block w-full shadow-sm text-sm border-gray-300 rounded-md p-2"
            :placeholder="placeholderJson"
          ></textarea>
        </div>
        
        <div v-if="importResult" class="p-4 rounded-md" :class="importResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'">
            <h4 class="font-bold">Import Result</h4>
            <p>{{ importResult.message }}</p>
            <p v-if="importResult.success" class="text-sm mt-1">
                Imported: {{ importResult.importedCount }}, Failed: {{ importResult.failedCount }}
            </p>
        </div>

      </div>
      
      <!-- Footer -->
      <div class="p-6 bg-gray-50 border-t flex justify-between items-center">
        <button @click="close" class="px-6 py-3 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-base font-semibold">
          Cancel
        </button>
        <button 
            @click="runImport" 
            :disabled="store.getLoading || !jsonString" 
            class="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 text-base font-semibold"
        >
          <span v-if="store.getLoading" class="i-heroicons-arrow-path-20-solid w-5 h-5 animate-spin mr-2"></span>
          {{ store.getLoading ? 'Importing...' : 'Import Configurations' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useToolManagementStore } from '~/stores/toolManagementStore';

interface ImportResult {
    success: boolean;
    message: string;
    importedCount?: number;
    failedCount?: number;
}

defineProps<{
  show: boolean;
}>();

const emit = defineEmits(['close']);
const store = useToolManagementStore();

const jsonString = ref('');
const importResult = ref<ImportResult | null>(null);

const placeholderJson = `{
  "mcpServers": {
    "my-first-server": {
      "command": "echo",
      "args": ["hello"]
    },
    "my-second-server": {
      "transportType": "streamable_http",
      "url": "http://localhost:8000/tools"
    }
  }
}`;

const close = () => {
  jsonString.value = '';
  importResult.value = null;
  emit('close');
};

const runImport = async () => {
    importResult.value = null;
    try {
        const result = await store.importMcpServerConfigs(jsonString.value);
        importResult.value = result; // Store the full result object
        if (result.success) {
            setTimeout(() => {
                close();
            }, 2500); // Close after 2.5 seconds on success to allow user to read result
        }
    } catch (e: any) {
        importResult.value = { success: false, message: e.message };
    }
};

</script>
