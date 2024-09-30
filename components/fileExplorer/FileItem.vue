<template>
  <div 
    ref="fileItemRef"
    :class="{ 'folder': !file.is_file, 'open': isFolderOpen }" 
    @click.stop="handleClick" 
    class="file-item cursor-pointer"
    draggable="true"
    @dragstart="onDragStart"
  >
    <div class="file-header flex items-center space-x-2 rounded p-2 transition-colors duration-200 hover:bg-gray-200">
      <div class="icon w-5 h-5 flex-shrink-0">
        <svg v-if="!file.is_file" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#87CEEB" class="w-full h-full">
          <path d="M20 18c0 .55-.45 1-1 1H5c-.55 0-1-.45-1-1V6c0-.55.45-1 1-1h5l2 1h7c.55 0 1 .45 1 1v11z"/>
        </svg>
        <i v-if="file.is_file && file.name.endsWith('.txt')" class="fas fa-file-alt text-gray-500"></i>
        <i v-else-if="file.is_file && file.name.endsWith('.jpg')" class="fas fa-file-image text-blue-500"></i>
        <i v-else-if="file.is_file" class="fas fa-file text-gray-500"></i>
      </div>
      <span class="text-sm text-gray-700">{{ file.name }}</span>
    </div>
    <transition name="folder">
      <div v-if="!file.is_file && isFolderOpen" class="children ml-4 mt-2">
        <FileItem v-for="(child, index) in file.children" :key="`${child.path}-${index}`" :file="child"/>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, ref } from 'vue'
import { TreeNode } from '~/utils/fileExplorer/TreeNode'
import { useFileExplorerStore } from '~/stores/fileExplorer'

const props = defineProps<{ file: TreeNode }>()
const fileExplorerStore = useFileExplorerStore()

const fileItemRef = ref<HTMLElement | null>(null)

const handleClick = () => {
  if (props.file.is_file) {
    fileExplorerStore.openFile(props.file.path)
  } else {
    fileExplorerStore.toggleFolder(props.file.path)
  }
}

const isFolderOpen = computed(() => !props.file.is_file && fileExplorerStore.isFolderOpen(props.file.path))

watch(isFolderOpen, (newValue) => {
  if (!props.file.is_file) {
    if (newValue) {
      console.log(`Folder '${props.file.name}' is now open. Children:`, props.file.children)
    } else {
      console.log(`Folder '${props.file.name}' is now closed.`)
    }
  }
})

onMounted(() => {
  console.log("File item:", props.file)
  if (!props.file.is_file) {
    console.log(`Child nodes of '${props.file.name}':`, props.file.children)
  }
})

const onDragStart = (event: DragEvent) => {
  event.stopPropagation()
  if (event.target === fileItemRef.value) {
    if (event.dataTransfer) {
      event.dataTransfer.setData('application/json', JSON.stringify(props.file))
      event.dataTransfer.effectAllowed = 'copy'
    }
  }
}
</script>