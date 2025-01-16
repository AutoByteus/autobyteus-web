<template>
  <div class="add-workspace-form p-4 bg-white rounded-lg border border-gray-200">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">Add New Workspace</h3>
    
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Workspace Name</label>
        <input 
          v-model="workspaceName" 
          type="text" 
          placeholder="Enter workspace name"
          class="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
        >
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Workspace Path</label>
        <input 
          v-model="workspacePath" 
          type="text" 
          placeholder="Enter workspace path"
          class="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
          @keyup.enter="handleSubmit"
        >
      </div>

      <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>

      <div class="flex justify-end gap-2">
        <button 
          @click="$emit('close')"
          class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Cancel
        </button>
        <button 
          @click="handleSubmit"
          class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Add Workspace
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useWorkspaceStore } from '~/stores/workspace'

const emit = defineEmits(['close', 'workspace-added'])
const workspaceStore = useWorkspaceStore()

const workspaceName = ref('')
const workspacePath = ref('')
const error = ref('')

const handleSubmit = async () => {
  if (!workspacePath.value || !workspaceName.value) {
    error.value = 'Both name and path are required'
    return
  }

  try {
    await workspaceStore.addWorkspace(workspacePath.value, workspaceName.value)
    emit('workspace-added')
    emit('close')
  } catch (err) {
    error.value = 'Failed to add workspace'
  }
}
</script>
