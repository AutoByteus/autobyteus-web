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
    <!-- Enhanced drag preview element -->
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

    <!-- Drop position indicators -->
    <div 
      v-if="showDropIndicator"
      class="absolute w-full transition-all duration-200"
      :class="[
        dropPosition === 'above' ? '-top-[2px]' : '',
        dropPosition === 'below' ? '-bottom-[2px]' : '',
        dropPosition === 'inside' ? 'inset-0' : ''
      ]"
    >
      <!-- Line indicator for above/below -->
      <div 
        v-if="dropPosition === 'above' || dropPosition === 'below'"
        class="absolute left-0 right-0 h-[2px] bg-blue-500 rounded"
      >
        <!-- Small circle on the line -->
        <div class="absolute -left-1 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full"></div>
      </div>
      
      <!-- Border indicator for dropping inside -->
      <div 
        v-if="dropPosition === 'inside'"
        class="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none"
        :class="{ 'opacity-50': !isValidDropTarget }"
      ></div>
    </div>

    <!-- File/Folder header -->
    <div 
      class="file-header flex items-center space-x-2 rounded p-2 transition-colors duration-200"
      :class="{ 
        'hover:bg-gray-200': !isDragging,
        'bg-blue-50': dropPosition === 'inside' && isValidDropTarget
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

      <!-- Name display/edit -->
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

    <!-- Children -->
    <transition name="folder">
      <div v-if="!file.is_file && isFolderOpen" class="children ml-4 mt-2">
        <FileItem v-for="(child, index) in file.children" :key="`${child.path}-${index}`" :file="child"/>
      </div>
    </transition>

    <!-- Context menu and delete dialog -->
    <FileContextMenu
      :visible="showContextMenu"
      :position="contextMenuPosition"
      @rename="startRename"
      @delete="promptDelete"
    />

    <ConfirmDeleteDialog 
      :show="showDeleteConfirm"
      :targetName="file.name"
      @confirm="onDeleteConfirmed"
      @cancel="onDeleteCanceled"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { TreeNode } from '~/utils/fileExplorer/TreeNode'
import { useFileExplorerStore } from '~/stores/fileExplorer'
import FileContextMenu from './FileContextMenu.vue'
import ConfirmDeleteDialog from './ConfirmDeleteDialog.vue'

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
const dropPosition = ref<'above' | 'below' | 'inside' | null>(null)
const showDropIndicator = ref(false)
const isGlobalDragging = ref(false)

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

const isFolderOpen = computed(() => {
  return !props.file.is_file && fileExplorerStore.isFolderOpen(props.file.path)
})

const isValidDropTarget = computed(() => {
  const dragData = window.dragData
  if (!dragData || !dragData.path) {
    return false
  }

  // Allow dropping on folders only (not files)
  if (props.file.is_file) {
    return false
  }

  // Prevent dropping an item onto itself
  if (props.file.path === dragData.path) {
    return false
  }

  // Prevent dropping a parent folder into its own child
  if (props.file.path.startsWith(dragData.path + '/')) {
    return false
  }

  return true
})

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

const onDragStart = (event: DragEvent) => {
  if (!event.dataTransfer || event.target !== fileItemRef.value) return

  isDragging.value = true
  dropPosition.value = null
  showDropIndicator.value = false
  isGlobalDragging.value = true
  
  window.dragData = { path: props.file.path }
  
  event.dataTransfer.setData('application/json', JSON.stringify({
    path: props.file.path
  }))
  
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
    
    event.dataTransfer.setDragImage(
      preview,
      -10, 
      rect.height / 2
    )

    setTimeout(() => preview.remove(), 0)
  }

  event.dataTransfer.effectAllowed = 'move'
}

const onDragEnter = (event: DragEvent) => {
  event.preventDefault()
  event.stopPropagation()
  
  if (!isValidDropTarget.value) return
  showDropIndicator.value = true
}

const onDragOver = (event: DragEvent) => {
  event.preventDefault()
  event.stopPropagation()
  
  if (!event.dataTransfer || !isValidDropTarget.value) {
    dropPosition.value = null
    showDropIndicator.value = false
    return
  }

  const rect = fileItemRef.value?.getBoundingClientRect()
  if (!rect) return

  const mouseY = event.clientY - rect.top
  const height = rect.height
  
  if (mouseY < height * 0.25) {
    dropPosition.value = 'above'
  } else if (mouseY > height * 0.75) {
    dropPosition.value = 'below'
  } else if (!props.file.is_file) {
    dropPosition.value = 'inside'
  } else {
    dropPosition.value = mouseY < height / 2 ? 'above' : 'below'
  }

  showDropIndicator.value = true
  event.dataTransfer.dropEffect = 'move'
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
  window.dragData = null
  isGlobalDragging.value = false
}

const onDrop = async (event: DragEvent) => {
  event.preventDefault()
  event.stopPropagation()
  
  const finalPosition = dropPosition.value
  dropPosition.value = null
  showDropIndicator.value = false
  isGlobalDragging.value = false
  
  if (!isValidDropTarget.value) return
  
  try {
    const data = event.dataTransfer?.getData('application/json')
    if (!data) return
    
    const { path: sourcePath } = JSON.parse(data)
    let destinationPath = props.file.path

    if (sourcePath === destinationPath) return

    const sourceBasename = sourcePath.split('/').pop() || ''
    
    if (finalPosition === 'inside' && !props.file.is_file) {
      destinationPath = destinationPath + '/' + sourceBasename
    } else {
      const parentPath = destinationPath.split('/').slice(0, -1).join('/')
      destinationPath = parentPath + '/' + sourceBasename
    }
    await fileExplorerStore.moveFileOrFolder(sourcePath, destinationPath)
  } catch (error) {
    console.error('Failed to move item:', error)
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

/* Enhanced drag preview styles */
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
  padding: 4px 8px;
  font-size: 12px;
  color: #374151;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  max-width: 200px;
}

.drag-preview-icon {
  width: 12px;
  height: 12px;
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

.drop-indicator {
  animation: pulse 1.5s infinite;
}
</style>
