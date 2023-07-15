<template>
    <div id="workspaceSelector">
        <label for="workspace">Select Workspace:</label>
        <select v-model="selectedWorkspace">
            <option v-for="workspace in workspaces" :key="workspace" :value="workspace">
                {{ workspace }}
            </option>
        </select>
        <button @click="addWorkspace">Add New Workspace</button>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

// Dummy workspace data, this should be fetched from API or Vuex store in a real app
const workspaces = ref(['Workspace 1', 'Workspace 2']);
const selectedWorkspace = ref(workspaces.value[0]);

const addWorkspace = () => {
    // Logic to add new workspace
    // After adding new workspace, you might want to update your workspaces array
    // and set selectedWorkspace to the newly added one
};

</script>
