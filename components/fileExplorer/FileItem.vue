<template>
  <div 
    ref="fileItemRef"
    :class="[
      'file-item cursor-pointer',
      { 
        'folder': !file.is_file, 
        'open': isFolderOpen,
        'dragging': isDragging,
        'relative': true 
      }
    ]"
    draggable="true"
    @click.stop="handleClick"
    @contextmenu.prevent="handleContextMenu"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
    @dragenter.stop="onDragEnter"
    @dragleave.stop="onDragLeave"
    @dragover.prevent.stop="onDragOver"
    @drop.prevent.stop="onDrop"
  >
    <!-- Hidden drag preview -->
    <div v-show="false" ref="dragPreviewRef" class="drag-preview">
      <div class="drag-preview-content">
        <div class="drag-preview-icon">
          <svg v-if="!file.is_file" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#87CEEB" class="w-full h-full">
            <path d="M20 18c0 .55-.45 1-1 1H5c-.55 0-1-.45-1-1V6c0-.55.45-1 1-1h5l2 1h7c.55 0 1 .45 1 1v11z"/>
          </svg>
          <i v-else class="fas fa-file text-gray-500"></i>
        </div>
        <span class="drag-preview-text">{{ file.name }}</span>
      </div>
    </div>

    <!-- Drop indicator -->
    <div 
      v-if="showDropIndicator && dropPosition === 'inside'"
      class="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none opacity-50"
    ></div>

    <!-- File/Folder Display -->
    <div 
      class="file-header flex items-center space-x-2 rounded p-2 transition-colors duration-200"
      :class="{ 
        'hover:bg-gray-200': !isDragging,
        'bg-blue-50': dropPosition === 'inside'
      }"
    >
      <div class="icon w-5 h-5 flex-shrink-0">
        <svg v-if="!file.is_file" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#87CEEB" class="w-full h-full">
          <path d="M20 18c0 .55-.45 1-1 1H5c-.55 0-1-.45-1-1V6c0-.55.45-1 1-1h5l2 1h7c.55 0 1 .45 1 1v11z"/>
        </svg>
        <i v-else-if="file.name.endsWith('.txt')" class="fas fa-file-alt text-gray-500"></i>
        <i v-else-if="file.name.endsWith('.jpg')" class="fas fa-file-image text-blue-500"></i>
        <i v-else class="fas fa-file text-gray-500"></i>
      </div>

      <template v-if="!isRenaming">
        <span class="text-sm text-gray-700 truncate">{{ file.name }}</span>
      </template>
      <template v-else>
        <input 
          class="border text-sm text-gray-700 px-1"
          type="text" 
          v-model="renameInput" 
          @keyup.enter="confirmRename"
          @blur="cancelRename"
          ref="renameInputRef"
        />
      </template>
    </div>

    <!-- Folder contents if open -->
    <transition name="folder">
      <div v-if="!file.is_file && isFolderOpen" class="children ml-4 mt-2">
        <FileItem v-for="(child, index) in file.children" :key="`${child.path}-${index}`" :file="child"/>
      </div>
    </transition>

    <!-- Context menu -->
    <FileContextMenu
      :visible="showContextMenu"
      :position="contextMenuPosition"
      @rename="startRename"
      @delete="promptDelete"
      @add-file="promptAddFile"
      @add-folder="promptAddFolder"
    />

    <!-- Delete confirmation -->
    <ConfirmDeleteDialog 
      :show="showDeleteConfirm"
      :targetName="file.name"
      @confirm="onDeleteConfirmed"
      @cancel="onDeleteCanceled"
    />

    <!-- Add file/folder dialog -->
    <AddFileOrFolderDialog
      :show="showAddDialog"
      :parentPath="file.path"
      :isFile="addFileMode"
      @confirm="onAddConfirmed"
      @cancel="onAddCanceled"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { TreeNode } from '~/utils/fileExplorer/TreeNode'
import { useFileExplorerStore } from '~/stores/fileExplorer'
import FileContextMenu from './FileContextMenu.vue'
import ConfirmDeleteDialog from './ConfirmDeleteDialog.vue'
import AddFileOrFolderDialog from './AddFileOrFolderDialog.vue'

const props = defineProps<{ file: TreeNode }>()
const fileExplorerStore = useFileExplorerStore()

const fileItemRef = ref<HTMLElement | null>(null)
const dragPreviewRef = ref<HTMLElement | null>(null)
const isDragging = ref(false)
const isRenaming = ref(false)
const renameInput = ref('')
const renameInputRef = ref<HTMLInputElement | null>(null)
const showContextMenu = ref(false)
const contextMenuPosition = ref({ top: 0, left: 0 })
const showDeleteConfirm = ref(false)
const dropPosition = ref<'inside' | null>(null)
const showDropIndicator = ref(false)
const isGlobalDragging = ref(false)

const showAddDialog = ref(false)
const addFileMode = ref(true)
let originalName = ''

onMounted(() => {
  document.addEventListener('closeAllFileContextMenus', onCloseAllContextMenus)
  document.addEventListener('dragover', onGlobalDragOver)
})

onBeforeUnmount(() => {
  document.removeEventListener('closeAllFileContextMenus', onCloseAllContextMenus)
  document.removeEventListener('dragover', onGlobalDragOver)
  if (showDropIndicator.value) {
    showDropIndicator.value = false
  }
})

const isFolderOpen = computed(() => {
  return !props.file.is_file && fileExplorerStore.isFolderOpen(props.file.path)
})

function onCloseAllContextMenus() {
  if (showContextMenu.value) {
    showContextMenu.value = false
    document.removeEventListener('click', onGlobalClick)
    document.removeEventListener('keydown', handleEscapeKey)
  }
}

const onGlobalDragOver = (event: DragEvent) => {
  const isOverFileExplorer = event.target instanceof Element && 
    (event.target.closest('.file-item') !== null || event.target.closest('.file-explorer') !== null)
  
  if (!isOverFileExplorer) {
    dropPosition.value = null
    showDropIndicator.value = false
  }
}

const handleClick = () => {
  if (props.file.is_file) {
    fileExplorerStore.openFile(props.file.path)
  } else {
    fileExplorerStore.toggleFolder(props.file.path)
  }
}

const handleContextMenu = (event: MouseEvent) => {
  event.preventDefault()
  event.stopPropagation()
  
  document.dispatchEvent(new Event('closeAllFileContextMenus'))

  showContextMenu.value = true
  contextMenuPosition.value = { 
    top: event.clientY,
    left: event.clientX
  }
  
  document.addEventListener('click', onGlobalClick)
  document.addEventListener('keydown', handleEscapeKey)
}

const handleEscapeKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    showContextMenu.value = false
    document.removeEventListener('keydown', handleEscapeKey)
  }
}

const onGlobalClick = () => {
  showContextMenu.value = false
  document.removeEventListener('click', onGlobalClick)
  document.removeEventListener('keydown', handleEscapeKey)
}

const startRename = () => {
  showContextMenu.value = false
  originalName = props.file.name
  renameInput.value = props.file.name
  isRenaming.value = true
  nextTick(() => {
    if (renameInputRef.value) {
      renameInputRef.value.focus()
      renameInputRef.value.select()
    }
  })
}

const confirmRename = async () => {
  isRenaming.value = false
  const newName = renameInput.value.trim()
  if (!newName || newName === originalName) {
    renameInput.value = originalName
    return
  }

  try {
    await fileExplorerStore.renameFileOrFolder(props.file.path, newName)
  } catch (error) {
    renameInput.value = originalName
    console.error('Rename failed:', error)
  }
}

const cancelRename = () => {
  isRenaming.value = false
  renameInput.value = originalName
}

const promptDelete = () => {
  showContextMenu.value = false
  showDeleteConfirm.value = true
}

const onDeleteConfirmed = async () => {
  showDeleteConfirm.value = false
  try {
    await fileExplorerStore.deleteFileOrFolder(props.file.path)
  } catch (error) {
    console.error('Failed to delete:', error)
  }
}

const onDeleteCanceled = () => {
  showDeleteConfirm.value = false
}

const promptAddFile = () => {
  showContextMenu.value = false
  addFileMode.value = true
  showAddDialog.value = true
}

const promptAddFolder = () => {
  showContextMenu.value = false
  addFileMode.value = false
  showAddDialog.value = true
}

function buildAddPath(node: TreeNode, newName: string): string {
  if (node.is_file) {
    const segments = node.path.split('/')
    segments.pop()
    const parentPath = segments.join('/')
    if (!parentPath) {
      return newName
    }
    return `${parentPath}/${newName}`
  } else {
    if (!node.path) {
      return newName
    }
    return `${node.path}/${newName}`
  }
}

async function onAddConfirmed(newName: string) {
  showAddDialog.value = false
  try {
    const finalPath = buildAddPath(props.file, newName)
    await fileExplorerStore.createFileOrFolder(finalPath, addFileMode.value)
  } catch (error) {
    console.error('Failed to create file/folder:', error)
  }
}

function onAddCanceled() {
  showAddDialog.value = false
}

const onDragStart = (event: DragEvent) => {
  event.stopPropagation()
  if (event.target === fileItemRef.value && event.dataTransfer) {
    isDragging.value = true
    dropPosition.value = null
    showDropIndicator.value = false
    isGlobalDragging.value = true

    event.dataTransfer.setData('application/json', JSON.stringify(props.file))
    event.dataTransfer.effectAllowed = 'move'

    if (dragPreviewRef.value) {
      const preview = dragPreviewRef.value.cloneNode(true) as HTMLElement
      preview.style.display = 'block'
      document.body.appendChild(preview)
      
      preview.style.position = 'fixed'
      preview.style.top = '0'
      preview.style.left = '0'
      preview.style.zIndex = '-1'
      preview.style.opacity = '1'
      
      const rect = preview.getBoundingClientRect()
      event.dataTransfer.setDragImage(preview, -10, rect.height / 2)
      setTimeout(() => preview.remove(), 0)
    }
  }
}

const onDragEnter = (event: DragEvent) => {
  event.preventDefault()
  event.stopPropagation()
  showDropIndicator.value = true
}

const onDragOver = (event: DragEvent) => {
  event.preventDefault()
  event.stopPropagation()

  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  } else {
    dropPosition.value = null
    showDropIndicator.value = false
    return
  }

  const rect = fileItemRef.value?.getBoundingClientRect()
  if (!rect) return

  const mouseY = event.clientY - rect.top
  const height = rect.height
  
  // Always set dropPosition to 'inside'
  dropPosition.value = 'inside'
  showDropIndicator.value = true
}

const onDragLeave = (event: DragEvent) => {
  event.preventDefault()
  event.stopPropagation()

  const rect = fileItemRef.value?.getBoundingClientRect()
  if (rect) {
    const relatedTarget = event.relatedTarget as HTMLElement
    if (!fileItemRef.value?.contains(relatedTarget) && 
        !relatedTarget?.closest('.file-item')) {
      dropPosition.value = null
      showDropIndicator.value = false
    }
  }
}

const onDragEnd = () => {
  isDragging.value = false
  dropPosition.value = null
  showDropIndicator.value = false
  isGlobalDragging.value = false
}

const onDrop = async (event: DragEvent) => {
  event.preventDefault()
  event.stopPropagation()
  
  const finalPosition = dropPosition.value
  dropPosition.value = null
  showDropIndicator.value = false
  isGlobalDragging.value = false
  
  try {
    const data = event.dataTransfer?.getData('application/json')
    if (!data) return
    
    const parsedData: TreeNode = JSON.parse(data)
    const sourcePath = parsedData.path
    
    if (sourcePath) {
      let destinationPath = props.file.path
      const sourceBasename = sourcePath.split('/').pop() || ''

      if (finalPosition === 'inside' && !props.file.is_file) {
        destinationPath = destinationPath + '/' + sourceBasename
      } else {
        const parentPath = destinationPath.split('/').slice(0, -1).join('/')
        destinationPath = parentPath + '/' + sourceBasename
      }

      await fileExplorerStore.moveFileOrFolder(sourcePath, destinationPath)
    }
  } catch (error) {
    console.error('Drop operation failed:', error)
  }
}
</script>

<style scoped>
.file-item {
  position: relative;
  transition: all 0.2s ease-out;
}

.file-header {
  position: relative;
  z-index: 1;
  transition: background-color 0.2s ease-out;
}

.file-header input {
  width: 140px;
}

.dragging {
  opacity: 0.5;
  transform: scale(0.98);
}

.drag-preview {
  position: fixed;
  top: -9999px;
  left: -9999px;
  z-index: -1;
  pointer-events: none;
}

.drag-preview-content {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 14px;
  color: #374151;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  max-width: 200px;
}

.drag-preview-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.drag-preview-text {
  overflow: hidden;
  text-overflow: ellipsis;
}

.folder-enter-active,
.folder-leave-active {
  transition: all 0.2s ease;
}

.folder-enter-from,
.folder-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.file-header:hover:not(.dragging) {
  background-color: rgba(229, 231, 235, 0.5);
}

.file-item:focus-within > .file-header {
  background-color: rgba(229, 231, 235, 0.7);
}

.drop-indicator-line {
  height: 2px;
  background-color: #3b82f6;
  position: absolute;
  left: 0;
  right: 0;
  transform: scaleX(0);
  transition: transform 0.15s ease-in-out;
}

.drop-indicator-line.active {
  transform: scaleX(1);
}

.drop-indicator-circle {
  width: 6px;
  height: 6px;
  background-color: #3b82f6;
  border-radius: 50%;
  position: absolute;
  left: -3px;
  top: -2px;
}

.file-item.dragging {
  opacity: 0.5;
  transform: scale(0.98);
}

.file-item:not(.dragging) {
  transition: transform 0.2s ease-out, opacity 0.2s ease-out;
}

.file-item.drag-over {
  transform: translateX(4px);
}

@keyframes pulse {
  0% {
    border-color: #3b82f6;
    opacity: 1;
  }
  50% {
    border-color: #60a5fa;
    opacity: 0.7;
  }
  100% {
    border-color: #3b82f6;
    opacity: 1;
  }
}
</style>
