<template>
    <div :class="{ 'folder': !file.is_file, 'open': isOpen.value }" @click="toggle" class="file-item">
        <div class="icon">
            <svg v-if="!file.is_file" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#87CEEB" class="folder-icon">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H6a2 2 0 01-2-2V5a2 2 0 011.293-1.858l3.704-1.48A2 2 0 0110 2h10a2 2 0 012 2v7M9 16a2 2 0 00-2 2v3a2 2 0 002 2h6a2 2 0 002-2v-3a2 2 0 00-2-2H9z"/>
            </svg>
            <i v-else class="fas fa-file"></i>
        </div>
        {{ file.name }}
        <transition name="folder">
            <div v-if="!file.is_file && isOpen.value" class="children">
                <FileItem v-for="(child, index) in file.children" :key="`${child.path}-${index}`" :file="child"/>
            </div>
        </transition>
    </div>
</template>


<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { TreeNode } from '../../utils/fileExplorer/TreeNode';
import FileItem from './FileItem.vue';

const props = defineProps<{ file: TreeNode }>();

const isOpen = ref(false);
const toggle = () => {
    if (!props.file.is_file) {
        console.log(`Toggled '${props.file.name}' from ${isOpen.value} to ${!isOpen.value}`);
        console.log(`Is directory? ${!props.file.is_file}`);
        isOpen.value = !isOpen.value;
        console.log(`Is open? ${isOpen.value}`);
    }
}

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
    align-items: center;
    cursor: pointer;
    margin-bottom: 0.5rem;
    color: #000;  
}

.file-item:hover {
    color: #000;  
}

.file-item .icon {
    margin-right: 0.5rem;
}

.folder {
    padding-left: 0rem;  
}

.folder .icon .fa-folder {
    transform: rotate(0);
    transition: transform 0.3s ease;
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
    transition: all 0.3s ease;
}
</style>
