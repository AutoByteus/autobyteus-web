<template>
  <div class="workspace-selector bg-gray-200 rounded-lg">
    <div class="p-4 space-y-4">
      <select 
        v-model="selectedWorkspaceId" 
        class="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
      >
        <option value="" disabled class="text-gray-900">Select a workspace</option>
        <option 
          v-for="id in workspaceIds" 
          :key="id" 
          :value="id"
          class="text-gray-900"
        >
          {{ getWorkspaceName(id) }}
        </option>
      </select>
      
      <div class="flex gap-2">
        <input 
          v-model="newWorkspacePath" 
          type="text" 
          placeholder="Enter new workspace path" 
          class="flex-1 p-2 border rounded-md focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
          @keyup="handleKeyup"
        >
        <button 
          @click="addWorkspace" 
          class="whitespace-nowrap px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          Add New Workspace
        </button>
      </div>
      
      <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useWorkspaceStore } from '~/stores/workspace'

const workspaceStore = useWorkspaceStore()

const workspaceIds = computed(() => workspaceStore.allWorkspaceIds)
const selectedWorkspaceId = ref('')
const newWorkspacePath = ref('')
const error = ref('')

const getWorkspaceName = (id: string) => {
  const workspace = workspaceStore.workspaces[id]
  return workspace ? workspace.name : 'Unknown Workspace'
}

const addWorkspace = async () => {
  if (!newWorkspacePath.value) {
    error.value = 'Workspace path cannot be empty'
    return
  }

  try {
    await workspaceStore.addWorkspace(newWorkspacePath.value)
    selectedWorkspaceId.value = workspaceStore.currentSelectedWorkspaceId
    newWorkspacePath.value = ''
    error.value = ''
  } catch (err) {
    error.value = 'Failed to add workspace'
  }
}

const handleKeyup = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    addWorkspace()
  }
}

watch(selectedWorkspaceId, (newValue) => {
  if (newValue) {
    workspaceStore.setSelectedWorkspaceId(newValue)
  }
})

onMounted(() => {
  workspaceStore.fetchAllWorkspaces()
})
</script>
