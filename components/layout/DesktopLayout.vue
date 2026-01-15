<template>
  <div class="hidden md:flex flex-1 relative space-x-0 min-h-0">
    <!-- Running + Config Panel -->
    <transition name="panel-minimize">
      <div 
        v-if="isRunningPanelOpen"
        :style="{ width: runningPanelWidth + 'px' }"
        class="bg-white border-r0 border-gray-200 shadow-xl flex flex-col overflow-hidden relative"
      >
        <LeftSidePanel />
      </div>
    </transition>
    
    <!-- Left Panel Drag Handle -->
    <div 
      v-if="isRunningPanelOpen"
      class="drag-handle-left hover:bg-emerald-500" 
      @mousedown="initDragLeftPanel"
      title="Drag to resize"
    ></div>

    <!-- Content Area -->
    <div class="bg-white p-0 shadow flex flex-col min-h-0 flex-1 min-w-[200px]">
      <div class="flex-1 overflow-auto">
        <AgentWorkspaceView v-if="isAgentSelected" />
        <TeamWorkspaceView v-else-if="isTeamSelected" />
        <div v-else class="flex items-center justify-center h-full text-gray-500">
          <p>Select or run an agent/team to begin.</p>
        </div>
      </div>
    </div>

    <div class="drag-handle" @mousedown="initDragRightPanel"></div>

    <!-- Right Panel -->
    <div 
      v-show="isRightPanelVisible"
      :style="{ width: rightPanelWidth + 'px' }" 
      class="bg-white p-0 shadow flex flex-col min-h-0 relative"
    >
      <RightSideTabs />
    </div>

    <RightSidebarStrip 
      v-if="!isRightPanelVisible" 
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useWorkspaceLeftPanelLayoutStore } from '~/stores/workspaceLeftPanelLayoutStore'
import { useRightPanel } from '~/composables/useRightPanel'
import AgentWorkspaceView from '~/components/workspace/agent/AgentWorkspaceView.vue'
import TeamWorkspaceView from '~/components/workspace/team/TeamWorkspaceView.vue'
import RightSideTabs from './RightSideTabs.vue'
import RightSidebarStrip from './RightSidebarStrip.vue'
import LeftSidePanel from '~/components/layout/LeftSidePanel.vue'
import { useAgentSelectionStore } from '~/stores/agentSelectionStore';

const workspaceLeftPanelLayoutStore = useWorkspaceLeftPanelLayoutStore()
const { panels } = storeToRefs(workspaceLeftPanelLayoutStore)
const selectionStore = useAgentSelectionStore();

// Panel State
const isRunningPanelOpen = computed(() => panels.value.running.isOpen)
const runningPanelWidth = ref(350)

// --- Left Panel Horizontal Resizing ---
const initDragLeftPanel = (event: MouseEvent) => {
  event.preventDefault()
  const startX = event.clientX
  const startWidth = runningPanelWidth.value
  const minWidth = 250
  const maxWidth = 800

  const doDrag = (e: MouseEvent) => {
    const deltaX = e.clientX - startX
    runningPanelWidth.value = Math.min(Math.max(startWidth + deltaX, minWidth), maxWidth)
  }

  const stopDrag = () => {
    document.removeEventListener('mousemove', doDrag)
    document.removeEventListener('mouseup', stopDrag)
    document.body.style.cursor = ''
  }

  document.addEventListener('mousemove', doDrag)
  document.addEventListener('mouseup', stopDrag)
  document.body.style.cursor = 'col-resize'
}

const { isRightPanelVisible, rightPanelWidth, initDragRightPanel } = useRightPanel()

const isAgentSelected = computed(() => selectionStore.selectedType === 'agent');
const isTeamSelected = computed(() => selectionStore.selectedType === 'team');

</script>

<style scoped>
.drag-handle {
  width: 4px;
  background-color: transparent;
  cursor: col-resize;
  transition: background-color 0.2s ease;
  position: relative;
  z-index: 10;
  margin-left: -2px; /* Overlap slightly */
}

.drag-handle-left {
  width: 4px;
  background-color: #e5e7eb;
  cursor: col-resize;
  transition: background-color 0.2s ease;
  z-index: 20;
}

.drag-handle-left:hover {
  background-color: #9ca3af;
}

.drag-handle-left:active {
  background-color: #6b7280;
}

.drag-handle:hover {
  background-color: #9ca3af;
}

.drag-handle:active {
  background-color: #6b7280;
}

.resizer-y {
  height: 4px;
  background-color: #f3f4f6;
  cursor: row-resize;
  border-top: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
  z-index: 10;
}

/* Subtle Panel Animation - quick 100ms for snappy feel */
.panel-minimize-enter-active,
.panel-minimize-leave-active {
  transition: opacity 100ms ease-out;
}

.panel-minimize-enter-from,
.panel-minimize-leave-to {
  opacity: 0;
}
</style>
