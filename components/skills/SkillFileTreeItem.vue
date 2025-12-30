<template>
  <div class="tree-item">
    <div 
      class="tree-node"
      :class="{ 'is-file': node.is_file, 'is-folder': !node.is_file }"
      @click="handleClick"
    >
      <span class="icon">{{ node.is_file ? '📄' : (isOpen ? '📂' : '📁') }}</span>
      <span class="name">{{ node.name }}</span>
    </div>
    
    <div v-if="!node.is_file && isOpen && node.children" class="children">
      <SkillFileTreeItem 
        v-for="child in node.children" 
        :key="child.id"
        :node="child"
        :skill-name="skillName"
        @selectFile="$emit('selectFile', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

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
}>()

const emit = defineEmits<{
  selectFile: [path: string]
}>()

const isOpen = ref(false)

function handleClick() {
  if (props.node.is_file) {
    // Emit file selection
    emit('selectFile', props.node.path)
  } else {
    // Toggle folder
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
  padding: 0.375rem 0.75rem;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.15s;
  font-size: 0.875rem;
}

.tree-node:hover {
  background: #e5e7eb;
}

.is-file .icon {
  font-size: 0.875rem;
}

.icon {
  margin-right: 0.5rem;
  font-size: 1rem;
  flex-shrink: 0;
}

.name {
  color: #374151;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.is-file .name {
  color: #1f2937;
}

.children {
  margin-left: 1rem;
  border-left: 1px solid #e5e7eb;
  padding-left: 0.25rem;
}
</style>
