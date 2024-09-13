<template>
  <div id="workspaceSelector">
    <div class="form-group">
      <label for="workspace">Select Workspace:</label>
      <select v-model="selectedWorkspace" v-if="workspaces.length > 0">
        <option v-for="workspace in workspaces" :key="workspace" :value="workspace">
          {{ workspace }}
        </option>
      </select>
      <span v-else>No Workspaces available</span>
    </div>
    <div class="form-group">
      <input v-model="newWorkspace" placeholder="Enter new workspace path" />
      <button @click="addWorkspace">Add New Workspace</button>
    </div>
    <transition name="fade">
      <p v-if="message" :class="messageClass">{{ message }}</p>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useWorkspaceStore } from '~/stores/workspace'

const workspaceStore = useWorkspaceStore()

const workspaces = computed(() => workspaceStore.workspaces)
const selectedWorkspace = ref(null as string | null)
const newWorkspace = ref('')
const message = computed(() => workspaceStore.message)
const messageClass = computed(() => workspaceStore.messageClass)

const addWorkspace = async () => {
  const success = await workspaceStore.addWorkspace(newWorkspace.value)
  if (success) {
    selectedWorkspace.value = newWorkspace.value
    newWorkspace.value = ''
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