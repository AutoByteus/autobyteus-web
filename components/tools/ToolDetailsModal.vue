<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" @click.self="close">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
      <!-- Header -->
      <div class="p-6 border-b">
        <div class="flex justify-between items-start">
          <div>
            <h2 class="text-2xl font-bold text-gray-900">{{ tool.name }}</h2>
            <p class="text-sm text-gray-500 mt-1">{{ tool.description }}</p>
          </div>
          <button @click="close" class="p-2 text-gray-500 hover:text-gray-800 rounded-full">
            <span class="i-heroicons-x-mark-20-solid w-6 h-6"></span>
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="p-6 overflow-y-auto">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Parameters</h3>
        <div v-if="parameters && parameters.length > 0" class="border rounded-lg overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required</th>
                <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="param in parameters" :key="param.name">
                <td class="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                  <code>{{ param.name }}</code>
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {{ param.paramType }}
                  </span>
                  <div v-if="param.enumValues" class="text-xs text-gray-500 mt-1">
                    Enum: [{{ param.enumValues.join(', ') }}]
                  </div>
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                  <span :class="param.required ? 'text-red-500' : 'text-green-600'">
                    {{ param.required ? 'Yes' : 'No' }}
                  </span>
                </td>
                <td class="px-4 py-4 text-sm text-gray-600">
                  <p>{{ param.description }}</p>
                  <p v-if="param.defaultValue" class="text-xs text-gray-500 mt-1">
                    Default: <code>{{ param.defaultValue }}</code>
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="text-center py-8 bg-gray-50 rounded-lg">
          <p class="text-gray-500">This tool does not require any parameters.</p>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="p-4 bg-gray-50 border-t text-right">
        <button @click="close" class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Tool } from '~/stores/toolManagementStore';

const props = defineProps<{  show: boolean;
  tool: Tool | null;
}>();

const emit = defineEmits(['close']);

const close = () => {
  emit('close');
};

const parameters = computed(() => {
  return props.tool?.argumentSchema?.parameters || [];
});
</script>
