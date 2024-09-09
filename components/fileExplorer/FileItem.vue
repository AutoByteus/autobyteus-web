<template>
    <div :class="{ 'folder': !file.is_file, 'open': isFileOpen }" @click.stop="toggle" class="file-item">
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
        <div v-if="!file.is_file && isFileOpen" class="children">
          <FileItem v-for="(child, index) in file.children" :key="`${child.path}-${index}`" :file="child"/>
        </div>
      </transition>
    </div>
  </template>
  
  <script setup lang="ts">
  import { computed } from 'vue'
  import { TreeNode } from '~/utils/fileExplorer/TreeNode'
  import { useFileExplorerStore } from '~/stores/fileExplorer'
  
  const props = defineProps<{ file: TreeNode }>()
  const fileExplorerStore = useFileExplorerStore()
  
  const toggle = () => {
    if (!props.file.is_file) {
      fileExplorerStore.toggleFile(props.file.path)
    }
  }
  
  const isFileOpen = computed(() => fileExplorerStore.openFiles[props.file.path] || false)
  
  watch(isFileOpen, (newValue) => {
    if (newValue) {
      console.log(`'${props.file.name}' is now open. Children:`, props.file.children)
    } else {
      console.log(`'${props.file.name}' is now closed.`)
    }
  })
  
  onMounted(() => {
    console.log("File item:", props.file)
    if (!props.file.is_file) {
      console.log(`Child nodes of '${props.file.name}':`, props.file.children)
    }
  })
  </script>
  
  <style scoped>
  /* ... (keep existing styles) ... */
  </style>