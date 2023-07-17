<template>
    <div id="fileExplorer" class="file-explorer">
        <h2>Project Files</h2>
        <div class="files">
            <FileItem v-for="file in files" :key="file.path" :file="file" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { workspaceTree } from '../../utils/workspaceState';
import FileItem from './FileItem.vue';

const files = computed(() => {
    return workspaceTree.value ? workspaceTree.value.children : [];
});

onMounted(() => {
    console.log("Workspace tree:", workspaceTree.value);
});
</script>

<style scoped>
.file-explorer {
    font-family: 'Courier New', monospace;
    color: #FFFFFF;
    background: #1E1E1E;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.06);
}

.file-explorer h2 {
    color: #020e14;
    margin-bottom: 1rem;
}

.file-explorer .files {
    padding-left: 1rem;
}
</style>
