<template>
  <div 
    v-if="isMinimized" 
    class="minimized-indicator"
    @click="handleRestore"
  >
    <div class="indicator-content">
      <CodeBracketSquareIcon class="editor-icon" />
      <span class="restore-text">File Editor</span>
      <ArrowsPointingOutIcon class="restore-icon" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { CodeBracketSquareIcon, ArrowsPointingOutIcon } from '@heroicons/vue/24/outline'
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useFileContentDisplayModeStore } from '~/stores/fileContentDisplayMode'
import { useFileExplorerStore } from '~/stores/fileExplorer'

const fileContentDisplayModeStore = useFileContentDisplayModeStore()
const fileExplorerStore = useFileExplorerStore()
const { isMinimizedMode } = storeToRefs(fileContentDisplayModeStore)

const isMinimized = computed(() => isMinimizedMode.value)

const handleRestore = () => {
  fileContentDisplayModeStore.restore()
}
</script>

<style scoped>
.minimized-indicator {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background-color: white;
  border: 1px solid #e2e8f0;
  border-radius: 40px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  z-index: 50;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;
}

.minimized-indicator:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.16);
  background-color: #f8fafc;
}

.indicator-content {
  padding: 14px 22px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.editor-icon {
  width: 24px;
  height: 24px;
  color: #475569;
  flex-shrink: 0;
}

.restore-text {
  font-size: 16px;
  font-weight: 500;
  color: #334155;
  line-height: 1.4;
}

.restore-icon {
  width: 22px;
  height: 22px;
  color: #3b82f6;
  transition: transform 0.2s ease;
}

.minimized-indicator:hover .restore-icon {
  transform: scale(1.15);
}

@keyframes slide-in {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.minimized-indicator {
  animation: slide-in 0.3s ease-out;
}
</style>
