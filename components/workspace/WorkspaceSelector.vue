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
import { ref } from 'vue'
import { useWorkspaceStore } from '~/stores/workspace'
import { useMutation } from '@vue/apollo-composable'
import { AddWorkspace } from '~/graphql/queries'
import { convertJsonToTreeNode } from '~/utils/fileExplorer/TreeNode'

const workspaceStore = useWorkspaceStore()

const workspaces = ref([] as string[])
const selectedWorkspace = ref(null as string | null)
const newWorkspace = ref('')
const message = ref(null as string | null)
const messageClass = ref('')

const { mutate: addWorkspaceMutation } = useMutation(AddWorkspace)

const addWorkspace = async () => {
  try {
    const { data } = await addWorkspaceMutation({
      variables: {
        workspaceRootPath: newWorkspace.value,
      },
    })
    if (data?.addWorkspace) {
      workspaceStore.setWorkspaceTree(convertJsonToTreeNode(data.addWorkspace))
      workspaces.value.push(newWorkspace.value)
      selectedWorkspace.value = newWorkspace.value
      newWorkspace.value = ''
      message.value = 'Workspace added successfully!'
      messageClass.value = 'success'
    }
  } catch (error) {
    message.value = 'Error adding workspace'
    messageClass.value = 'error'
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