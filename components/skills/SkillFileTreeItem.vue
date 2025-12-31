<template>
  <div class="tree-item">
    <div 
      class="tree-node"
      :class="{ 'is-file': node.is_file, 'is-folder': !node.is_file, 'is-active': isActive }"
      @click="handleClick"
    >
      <div class="icon-wrapper">
        <!-- Folder Icon (matching FileItem.vue) -->
        <svg 
          v-if="!node.is_file" 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="currentColor" 
          class="icon folder-icon"
        >
          <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
        </svg>
        <!-- File Icon (matching FileItem.vue) -->
        <svg 
          v-else 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke-width="1.5" 
          stroke="currentColor" 
          class="icon file-icon"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      </div>
      <span class="name">{{ node.name }}</span>
    </div>
    
    <div v-if="!node.is_file && isOpen && node.children" class="children">
      <SkillFileTreeItem 
        v-for="child in node.children" 
        :key="child.id"
        :node="child"
        :skill-name="skillName"
        :selected-path="selectedPath"
        @selectFile="$emit('selectFile', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface TreeNode {
  name: string
  is_file: boolean
  path: string
  id: string
  children?: TreeNode[]
}

const props = defineProps<{
  node: TreeNode
  skillName: string
  selectedPath?: string
}>()

const emit = defineEmits<{
  selectFile: [path: string]
}>()

const isOpen = ref(false)

const isActive = computed(() => {
  return props.node.is_file && props.node.path === props.selectedPath
})

function handleClick() {
  if (props.node.is_file) {
    emit('selectFile', props.node.path)
  } else {
    isOpen.value = !isOpen.value
  }
}
</script>

<style scoped>
.tree-item {
  user-select: none;
}

.tree-node {
  display: flex;
  align-items: center;
  padding: 0.375rem 0.5rem;
  cursor: pointer;
  border-radius: 0 4px 4px 0;
  border-left: 2px solid transparent;
  margin-left: 8px;
  transition: all 0.15s;
  font-size: 0.875rem;
  color: #4b5563;
  margin-bottom: 1px;
}

.tree-node:hover {
  background: rgba(229, 231, 235, 0.5);
  color: #111827;
}

.tree-node.is-active {
  background: #eff6ff;
  color: #1d4ed8;
  border-left-color: #3b82f6;
}

.icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  margin-right: 0.375rem;
  flex-shrink: 0;
}

.icon {
  width: 100%;
  height: 100%;
}

.folder-icon {
  color: #60a5fa;
}

.tree-node:hover .folder-icon {
  color: #3b82f6;
}

.is-active .folder-icon {
  color: #3b82f6;
}

.file-icon {
  color: #9ca3af;
}

.tree-node:hover .file-icon {
  color: #6b7280;
}

.is-active .file-icon {
  color: #3b82f6;
}

.name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.children {
  margin-left: 1rem;
  padding-left: 0.25rem;
}
</style>
