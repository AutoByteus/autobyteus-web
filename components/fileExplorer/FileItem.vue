<template>
  <div 
    ref="fileItemRef"
    :class="{ 'folder': !file.is_file, 'open': isFolderOpen }" 
    @click.stop="handleClick" 
    class="file-item cursor-pointer relative"
    draggable="true"
    @dragstart="onDragStart"
    @dragover.prevent="onDragOver"
    @drop="onDrop"
    @dblclick="handleDoubleClick"
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
      <div v-if="isEditing" class="ml-2">
        <input 
          v-model="newName" 
          @keyup.enter="submitRename" 
          @keyup.esc="cancelRename"
          class="border rounded px-2 py-1 text-sm"
          ref="renameInput"
        />
      </div>
    </div>

    <!-- Action Buttons -->
    <div v-if="showActions" class="absolute right-2 top-2 flex space-x-1">
      <button @click.stop="startRename" class="text-blue-500 hover:text-blue-700">
        <i class="fas fa-pen"></i>
      </button>
      <button @click.stop="confirmDelete" class="text-red-500 hover:text-red-700">
        <i class="fas fa-trash"></i>
      </button>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirm" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div class="bg-white p-4 rounded shadow-lg">
        <p>Are you sure you want to delete "{{ file.name }}"?</p>
        <div class="mt-4 flex justify-end space-x-2">
          <button @click="cancelDelete" class="px-4 py-2 bg-gray-300 text-gray-700 rounded">Cancel</button>
          <button @click="deleteFile" class="px-4 py-2 bg-red-500 text-white rounded">Delete</button>
        </div>
      </div>
    </div>

    <!-- Highlight Drop Target -->
    <div v-if="isDropTarget" class="absolute inset-0 bg-blue-100 bg-opacity-50 rounded"></div>

    <!-- Click-Away Overlay for Rename Input -->
    <div v-if="isEditing" v-click-away="onClickAway" class="absolute top-0 left-0 w-full h-full"></div>

    <transition name="folder">
      <div v-if="!file.is_file && isFolderOpen" class="children ml-4 mt-2">
        <FileItem v-for="(child, index) in file.children" :key="`${child.path}-${index}`" :file="child" />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { TreeNode } from '~/utils/fileExplorer/TreeNode'
import { useFileExplorerStore } from '~/stores/fileExplorer'

// Define props
const props = defineProps<{ file: TreeNode }>()

// Access the Pinia store
const fileExplorerStore = useFileExplorerStore()

// Refs
const fileItemRef = ref<HTMLElement | null>(null)
const renameInput = ref<HTMLInputElement | null>(null)

// Reactive states
const showActions = ref(false)
const showDeleteConfirm = ref(false)
const isEditing = ref(false)
const newName = ref('')
const isDropTarget = ref(false)

// Handle click on file/folder
const handleClick = () => {
  if (props.file.is_file) {
    fileExplorerStore.openFile(props.file.path)
  } else {
    fileExplorerStore.toggleFolder(props.file.path)
  }
}

// Handle double-click for renaming
const handleDoubleClick = () => {
  startRename()
}

// Computed property to determine if folder is open
const isFolderOpen = computed(() => !props.file.is_file && fileExplorerStore.isFolderOpen(props.file.path))

// Drag and Drop handlers
const onDragStart = (event: DragEvent) => {
  event.stopPropagation()
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/json', JSON.stringify(props.file))
    event.dataTransfer.effectAllowed = 'move'
  }
}

const onDragOver = (event: DragEvent) => {
  if (!props.file.is_file) {
    isDropTarget.value = true
  }
}

const onDrop = async (event: DragEvent) => {
  event.preventDefault()
  event.stopPropagation()
  isDropTarget.value = false

  if (!props.file.is_file) {
    const data = event.dataTransfer?.getData('application/json')
    if (data) {
      const draggedFile: TreeNode = JSON.parse(data)
      const sourcePath = draggedFile.path
      const destinationPath = props.file.path

      // Prevent moving a folder into itself or its subfolders
      if (sourcePath === destinationPath || destinationPath.startsWith(sourcePath)) {
        alert('Cannot move a folder into itself or its subfolders.')
        return
      }

      try {
        await fileExplorerStore.moveFile(fileExplorerStore.workspaceId, sourcePath, destinationPath)
        alert(`Moved "${draggedFile.name}" to "${props.file.name}" successfully.`)
      } catch (error: any) {
        alert(`Move failed: ${error.message}`)
      }
    }
  }
}

// Rename handlers
const startRename = () => {
  isEditing.value = true
  newName.value = props.file.name
  // Focus the input after rendering
  nextTick(() => {
    renameInput.value?.focus()
  })
}

const submitRename = async () => {
  if (newName.value.trim() === '') {
    alert('Name cannot be empty.')
    return
  }
  try {
    await fileExplorerStore.renameFile(fileExplorerStore.workspaceId, props.file.path, newName.value.trim())
    isEditing.value = false
  } catch (error: any) {
    alert(`Rename failed: ${error.message}`)
  }
}

const cancelRename = () => {
  isEditing.value = false
}

// Delete handlers
const confirmDelete = () => {
  showDeleteConfirm.value = true
}

const cancelDelete = () => {
  showDeleteConfirm.value = false
}

const deleteFile = async () => {
  try {
    await fileExplorerStore.deleteFile(fileExplorerStore.workspaceId, props.file.path)
    showDeleteConfirm.value = false
  } catch (error: any) {
    alert(`Delete failed: ${error.message}`)
    showDeleteConfirm.value = false
  }
}

// Action buttons visibility on hover
const handleMouseEnter = () => {
  showActions.value = true
}

const handleMouseLeave = () => {
  showActions.value = false
}

onMounted(() => {
  const element = fileItemRef.value
  if (element) {
    element.addEventListener('mouseenter', handleMouseEnter)
    element.addEventListener('mouseleave', handleMouseLeave)
  }
})

// Cleanup Event Listeners
onBeforeUnmount(() => {
  const element = fileItemRef.value
  if (element) {
    element.removeEventListener('mouseenter', handleMouseEnter)
    element.removeEventListener('mouseleave', handleMouseLeave)
  }
})

// Click-away handler
const onClickAway = () => {
  if (isEditing.value) {
    cancelRename()
  }
}
</script>

<style scoped>
.file-item {
  position: relative;
}

.file-header {
  display: flex;
  align-items: center;
  width: 100%;
}

.close-button {
  font-size: 18px;
}

.close-button:hover {
  background-color: rgba(239, 68, 68, 0.1);
}

.close-button:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.5);
}

button {
  cursor: pointer;
}

.folder-enter-active, .folder-leave-active {
  transition: all 0.3s ease;
}

.folder-enter-from, .folder-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.absolute.inset-0.bg-blue-100.bg-opacity-50.rounded {
  pointer-events: none;
}

/* Additional styles to position the click-away overlay */
.absolute.top-0.left-0.w-full.h-full {
  z-index: 1;
}
</style>