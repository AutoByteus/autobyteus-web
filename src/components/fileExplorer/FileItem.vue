<template>
    <div :class="{ 'folder': !file.is_file, 'open': isFileOpen() }" @click.stop="toggle" class="file-item">
        <div class="file-header">
            <div class="icon">
                <svg v-if="!file.is_file" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#87CEEB" class="mac-folder-icon">
                    <path d="M20 18c0 .55-.45 1-1 1H5c-.55 0-1-.45-1-1V6c0-.55.45-1 1-1h5l2 1h7c.55 0 1 .45 1 1v11z"/>
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
import { onMounted, watch, reactive } from 'vue';
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

.mac-folder-icon {
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
