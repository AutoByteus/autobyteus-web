<template>
  <Teleport to="body">
    <div 
      v-if="visible" 
      ref="menuRef"
      class="fixed bg-gray-50 rounded-lg shadow-lg border border-gray-200 z-[9999] py-2 min-w-[200px] overflow-hidden"
      :style="menuStyle"
    >
      <ul class="text-gray-700">
        <li 
          v-for="(item, index) in menuItems" 
          :key="index"
          class="menu-item flex items-center px-5 py-2.5 hover:bg-blue-50 cursor-pointer transition-colors duration-150"
          @click="item.action"
        >
          <component 
            :is="item.icon" 
            class="w-5 h-5 mr-3 text-gray-500"
          />
          <span>{{ item.label }}</span>
        </li>
      </ul>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  PencilSquareIcon,
  TrashIcon
} from '@heroicons/vue/24/outline'

interface ContextMenuPosition {
  top: number
  left: number
}

interface Props {
  visible: boolean
  position: ContextMenuPosition
}

const props = defineProps<Props>()
const emit = defineEmits<{  (e: 'rename'): void
  (e: 'delete'): void
}>()

const menuRef = ref<HTMLElement | null>(null)

const menuItems = [
  {
    label: 'Rename',
    icon: PencilSquareIcon,
    action: () => emit('rename')
  },
  {
    label: 'Delete',
    icon: TrashIcon,
    action: () => emit('delete')
  }
]

const menuStyle = computed(() => {
  if (!menuRef.value) {
    return {
      top: `${props.position.top}px`,
      left: `${props.position.left}px`,
      opacity: 0
    }
  }

  const menu = menuRef.value
  const menuRect = menu.getBoundingClientRect()
  const windowWidth = window.innerWidth
  const windowHeight = window.innerHeight

  let top = props.position.top
  let left = props.position.left

  // Adjust if menu would go off bottom of screen
  if (top + menuRect.height > windowHeight) {
    top = top - menuRect.height
  }

  // Adjust if menu would go off right of screen
  if (left + menuRect.width > windowWidth) {
    left = left - menuRect.width
  }

  return {
    top: `${top}px`,
    left: `${left}px`,
    opacity: 1
  }
})

watch(() => props.visible, (newVisible) => {
  if (newVisible && menuRef.value) {
    // Reset position when menu is shown
    const { top, left } = menuStyle.value
    menuRef.value.style.top = top
    menuRef.value.style.left = left
  }
})

// Clean up when component is destroyed
onUnmounted(() => {
  if (props.visible) {
    document.removeEventListener('click', onGlobalClick)
  }
})
</script>

<style scoped>
.fixed {
  position: fixed;
  opacity: 0;
  transform-origin: top left;
  animation: menuAppear 0.1s ease forwards;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.menu-item {
  user-select: none;
}

@keyframes menuAppear {
  from {
    opacity: 0;
    transform: scale(0.98);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Add smooth transitions */
.menu-item {
  transition: all 0.2s ease;
}

.menu-item:hover {
  background-color: rgba(59, 130, 246, 0.05);
}

/* Add a subtle divider between items */
.menu-item:not(:last-child) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}
</style>
