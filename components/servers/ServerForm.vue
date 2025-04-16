<template>
  <div class="bg-white shadow-sm rounded-lg p-6">
    <h3 class="text-lg font-medium mb-4">{{ isEdit ? 'Edit Server' : 'Add New Server' }}</h3>
    
    <form @submit.prevent="handleSubmit">
      <div class="mb-4">
        <label for="serverName" class="block text-sm font-medium text-gray-700 mb-1">Server Name</label>
        <input 
          id="serverName" 
          v-model="form.name" 
          type="text" 
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      
      <div class="mb-4">
        <label for="serverUrl" class="block text-sm font-medium text-gray-700 mb-1">Server URL</label>
        <input 
          id="serverUrl" 
          v-model="form.url" 
          type="url" 
          required
          placeholder="https://"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      
      <div class="mb-4">
        <label for="apiKey" class="block text-sm font-medium text-gray-700 mb-1">API Key (optional)</label>
        <input 
          id="apiKey" 
          v-model="form.apiKey" 
          type="text"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      
      <div class="flex justify-end space-x-3 mt-6">
        <button 
          type="button" 
          @click="$emit('cancel')"
          class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button 
          type="submit"
          class="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {{ isEdit ? 'Update' : 'Add' }} Server
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineProps, defineEmits } from 'vue';

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({
      name: '',
      url: '',
      apiKey: ''
    })
  },
  serverType: {
    type: String,
    required: true,
    validator: (value: string) => ['mcp', 'agent'].includes(value)
  }
});

const emit = defineEmits(['submit', 'cancel']);

const form = ref({
  name: props.initialData.name || '',
  url: props.initialData.url || '',
  apiKey: props.initialData.apiKey || ''
});

const isEdit = computed(() => !!props.initialData.name);

const handleSubmit = () => {
  emit('submit', {
    id: props.initialData.id || Date.now().toString(),
    type: props.serverType,
    name: form.value.name,
    url: form.value.url,
    apiKey: form.value.apiKey,
    status: 'connected' // for demo purposes
  });
};
</script>
