<template>
    <div :class="{ 'folder': !file.is_file, 'open': isFileOpen() }" @click.stop="toggle" class="file-item">
        <div class="file-header">
            <div class="icon">
                <svg v-if="!file.is_file" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#87CEEB" class="folder-icon">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H6a2 2 0 01-2-2V5a2 2 0 011.293-1.858l3.704-1.48A2 2 0 0110 2h10a2 2 0 012 2v7M9 16a2 2 0 00-2 2v3a2 2 0 002 2h6a2 2 0 002-2v-3a2 2 0 00-2-2H9z"/>
                </svg>
                <i v-if="file.is_file && file.name.endsWith('.txt')" class="fas fa-file-alt"></i>
                <i v-else-if="file.is_file && file.name.endsWith('.jpg')" class="fas fa-file-image"></i>
                <i v-else-if="file.is_file" class="fas fa-file"></i>
            </div>
            {{ file.name }}
        </div>
        <transition name="folder">
            <div v-if="!file.is_file && isFileOpen()" class="children">
                <FileItem v-for="(child, index) in file.children" :key="`${child.path}-${index}`" :file="child"/>
            </div>
        </transition>
    </div>
</template>

<script setup lang="ts">
import { onMounted, watch,reactive } from 'vue';
import { TreeNode } from '../../utils/fileExplorer/TreeNode';
import FileItem from './FileItem.vue';

const props = defineProps<{ file: TreeNode }>();

// Create a Map to store open states for each file
const openStates = reactive(new Map());

const toggle = () => {
    if (!props.file.is_file) {
        // Use the file name as the key for the Map
        const isOpen = openStates.get(props.file.name);
        openStates.set(props.file.name, !isOpen);
    }
}

const isFileOpen = () => {
    return openStates.get(props.file.name);
}

watch(isFileOpen, (newValue, oldValue) => {
    if (newValue) {
        console.log(`'${props.file.name}' is now open. Children:`, props.file.children);
    } else {
        console.log(`'${props.file.name}' is now closed.`);
    }
});

onMounted(() => {
    console.log("File item:", props.file);
    if (!props.file.is_file) {
        console.log(`Child nodes of '${props.file.name}':`, props.file.children);
    }
});
</script>

<style scoped>
.file-item {
    display: flex;
    flex-direction: column;
    cursor: pointer;
    margin-bottom: 0.5rem;
    color: #333;  
}

.file-header {
    display: flex;
    align-items: center;
    font-size: 1.1em;
    line-height: 1.5em;
    font-weight: 500;
}

.file-item:hover {
    color: #007BFF;
    background: #F8F9FA;
}

.file-item:active {
    background: #E9ECEF;
}

.file-item .icon {
    margin-right: 0.5rem;
}

.folder {
    color: #08516e;
}

.folder-icon {
    stroke: #08516e;
    width: 1em;
    height: 1em;
}

.folder.open .icon .fa-folder {
    transform: rotate(90deg);
}

.children {
    padding-left: 1.5rem;
    margin-top: 0.5rem;
    transition: max-height 0.3s ease;
}
</style>
