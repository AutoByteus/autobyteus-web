<template>
  <div class="tree-item">
    <div 
      class="tree-node"
      :class="{ 'is-file': node.is_file, 'is-folder': !node.is_file, 'is-active': isActive }"
      @click="handleClick"
    >
      <div class="icon-wrapper">
        <Icon 
          v-if="node.is_file" 
          icon="heroicons:document-text" 
          class="icon file-icon" 
        />
        <Icon 
          v-else 
          :icon="isOpen ? 'heroicons:folder-open' : 'heroicons:folder'" 
          class="icon folder-icon" 
        />
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
import { Icon } from '@iconify/vue'

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
  border-radius: 6px;
  transition: all 0.15s;
  font-size: 0.875rem;
  color: #4b5563;
  margin-bottom: 1px;
}

.tree-node:hover {
  background: #f3f4f6;
  color: #111827;
}

.tree-node.is-active {
  background: #eff6ff;
  color: #2563eb;
}

.icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  margin-right: 0.5rem;
  flex-shrink: 0;
}

.icon {
  font-size: 1.125rem;
}

.folder-icon {
  color: #60a5fa;
}

.is-active .folder-icon {
  color: #3b82f6;
}

.file-icon {
  color: #9ca3af;
}

.tree-node:hover .folder-icon {
  color: #3b82f6;
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
  margin-left: 0.875rem;
  border-left: 1px solid #e5e7eb;
  padding-left: 0.25rem;
}
</style>
