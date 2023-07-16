<!-- src/components/WorkspaceSelector.vue -->

<template>
  <div id="workspaceSelector">
    <label for="workspace">Select Workspace:</label>
    <select v-model="selectedWorkspace" v-if="workspaces.length > 0">
        <option v-for="workspace in workspaces" :key="workspace" :value="workspace">
            {{ workspace }}
        </option>
    </select>
    <span v-else>No Workspaces available</span>
    <input type="text" v-model="newWorkspace" placeholder="Enter new workspace path" />
    <button @click="addWorkspace">Add New Workspace</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { AddWorkspace } from '../../graphql/queries';
import { useMutation } from '@vue/apollo-composable';
import { convertJsonToTreeNode } from '../../utils/fileExplorer/TreeNode';
import { setWorkspaceTree } from '../../utils/workspaceState';

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

const addWorkspace = () => {
  addWorkspaceMutation();
};
</script>


  
<style scoped>
  #workspaceSelector {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: #e9ecef;
    padding: 15px;
    border-radius: 10px;
    margin-bottom: 20px;
  }
  
  #workspaceSelector label {
    margin-right: 10px;
  }
  
  #workspaceSelector select,
  #workspaceSelector input {
    margin-right: 10px;
    padding: 5px;
    border-radius: 5px;
    border: 1px solid #ccc;
  }
  
  #workspaceSelector button {
    padding: 5px 10px;
    border-radius: 5px;
    border: none;
    background-color: #4285f4;
    color: white;
  }
  </style>
  