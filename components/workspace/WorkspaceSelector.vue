<template>
  <div class="workspace-selector p-4 bg-gray-100 rounded-lg">
    <div class="flex flex-col space-y-4">
      <div class="flex space-x-2">
        <select 
          v-model="selectedWorkspace" 
          class="flex-grow p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
        >
          <option value="" disabled>Select a workspace</option>
          <option v-for="workspace in workspaces" :key="workspace" :value="workspace">
            {{ workspace }}
          </option>
        </select>
      </div>
      
      <div class="flex space-x-2">
        <input 
          v-model="newWorkspace" 
          type="text" 
          placeholder="Enter new workspace path" 
          class="flex-grow p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
        >
        <button 
          @click="addWorkspace" 
          class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
        >
          Add New Workspace
        </button>
      </div>
      
      <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useWorkspaceStore } from '~/stores/workspace'

const workspaceStore = useWorkspaceStore()

const workspaces = computed(() => workspaceStore.workspaces)
const selectedWorkspace = ref('')
const newWorkspace = ref('')
const error = ref('')

const addWorkspace = async () => {
  if (!newWorkspace.value) {
    error.value = 'Workspace path cannot be empty'
    return
  }

  try {
    await workspaceStore.addWorkspace(newWorkspace.value)
    selectedWorkspace.value = newWorkspace.value
    newWorkspace.value = ''
    error.value = ''
  } catch (err) {
    error.value = 'Failed to add workspace'
  }
}

watch(selectedWorkspace, (newValue) => {
  if (newValue) {
    workspaceStore.setSelectedWorkspacePath(newValue)
  }
})
</script>