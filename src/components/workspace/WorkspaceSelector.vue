<!-- src/components/WorkspaceSelector.vue -->

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
      <input type="text" v-model="newWorkspace" placeholder="Enter new workspace path" />
      <button @click="addWorkspace">Add New Workspace</button>
    </div>
    <transition name="fade">
      <p v-if="message" :class="messageClass">{{ message }}</p>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import { AddWorkspace } from '../../graphql/queries';
import { useMutation } from '@vue/apollo-composable';
import { convertJsonToTreeNode } from '../../utils/fileExplorer/TreeNode';
import { setWorkspaceTree, setSelectedWorkspacePath } from '../../store/workspaceState';

const workspaces = ref([] as string[]);
const selectedWorkspace = ref(null as string | null);
const newWorkspace = ref('');

const { mutate: addWorkspaceMutation } = useMutation(AddWorkspace, () => ({
  variables: {
    workspaceRootPath: newWorkspace.value,
  },
  update: (_cache, { data }) => {
    if (data?.addWorkspace) {
      setWorkspaceTree(convertJsonToTreeNode(data.addWorkspace));
      workspaces.value.push(newWorkspace.value);
      selectedWorkspace.value = newWorkspace.value;
      newWorkspace.value = '';
    } else {
      console.error('Error adding workspace');
    }
  }
}));

const message = ref(null as string | null);
const messageClass = ref('');

const addWorkspace = () => {
  addWorkspaceMutation().then(() => {
    message.value = 'Workspace added successfully!';
    messageClass.value = 'success';
  }).catch(() => {
    message.value = 'Error adding workspace';
    messageClass.value = 'error';
  });
};

// Watch for changes to selectedWorkspace and update it in the store
watchEffect(() => {
  setSelectedWorkspacePath(selectedWorkspace.value);
});
</script>

<style scoped>
#workspaceSelector {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 20px;
}

.form-group {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

label {
  margin-right: 10px;
  font-size: 1.1em;
  color: #343a40;
}

select, input {
  margin-right: 10px;
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #ced4da;
  font-size: 1em;
  background-color: #fff;
}

select:hover, input:hover {
  border-color: #495057;
}

button {
  padding: 10px 20px;
  border-radius: 5px;
  border: none;
  background: linear-gradient(to right, #4285f4, #2ec7fd);
  color: white;
  font-size: 1em;
  cursor: pointer;
  transition: background 0.5s ease;
}

button:hover {
  background: linear-gradient(to right, #2ec7fd, #4285f4);
}

.success {
  color: #28a745;
}

.error {
  color: #dc3545;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
../../store/workspaceState