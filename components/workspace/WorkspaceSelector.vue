<template>
  <div class="space-y-4">
    <div class="flex space-x-4">
      <select class="flex-grow p-2 border rounded-md focus:ring-2 focus:ring-blue-500">
        <option>No Workspaces available</option>
      </select>
      <button class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors">
        Add New Workspace
      </button>
    </div>
    <input 
      type="text" 
      placeholder="Enter new workspace path" 
      class="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
    >
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useWorkspaceStore } from '~/stores/workspace'

const workspaceStore = useWorkspaceStore()

const workspaces = computed(() => workspaceStore.workspaces)
const selectedWorkspace = ref(null as string | null)
const newWorkspace = ref('')

const addWorkspace = async () => {
  try {
    await workspaceStore.addWorkspace(newWorkspace.value)
    selectedWorkspace.value = newWorkspace.value
    newWorkspace.value = ''
  } catch (error) {
    console.error('Failed to add workspace:', error)
  }
}

watch(selectedWorkspace, (newValue) => {
  if (newValue) {
    workspaceStore.setSelectedWorkspacePath(newValue)
  }
})
</script>

<style scoped>
/* ... (keep existing styles) ... */
</style>