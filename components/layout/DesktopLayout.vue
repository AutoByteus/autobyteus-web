<template>
  <div class="hidden md:flex flex-1 relative space-x-0 min-h-0">
    <!-- Launch Profile Panel -->
    <transition name="panel-minimize">
      <div 
        v-if="isProfilePanelOpen"
        :style="{ width: profilePanelWidth + 'px' }"
        class="bg-white border-r border-gray-200 shadow-xl flex flex-col overflow-hidden"
      >
        <div class="flex-1 overflow-auto p-0">
          <LaunchProfilePanel />
        </div>
      </div>
    </transition>

    <!-- Content Area - Always shows workspace views -->
    <div class="bg-white p-0 shadow flex flex-col min-h-0 flex-1 min-w-[200px]">
      <div class="flex-1 overflow-auto">
        <AgentWorkspaceView v-if="selectedLaunchProfileStore.selectedProfileType === 'agent'" />
        <TeamWorkspaceView v-else-if="selectedLaunchProfileStore.selectedProfileType === 'team'" />
        <div v-else class="flex items-center justify-center h-full text-gray-500">
          <p>Select a profile to begin.</p>
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
import { useSelectedLaunchProfileStore } from '~/stores/selectedLaunchProfileStore';
import AgentWorkspaceView from '~/components/workspace/agent/AgentWorkspaceView.vue'
import TeamWorkspaceView from '~/components/workspace/team/TeamWorkspaceView.vue'
import RightSideTabs from './RightSideTabs.vue'
import RightSidebarStrip from './RightSidebarStrip.vue'
import LaunchProfilePanel from '~/components/launchProfiles/LaunchProfilePanel.vue'

const workspaceLeftPanelLayoutStore = useWorkspaceLeftPanelLayoutStore()
const { panels } = storeToRefs(workspaceLeftPanelLayoutStore)
const selectedLaunchProfileStore = useSelectedLaunchProfileStore();

// Panel State from new central store
const isProfilePanelOpen = computed(() => panels.value.launchProfile.isOpen)
const profilePanelWidth = ref(300)

const { isRightPanelVisible, rightPanelWidth, toggleRightPanel, initDragRightPanel } = useRightPanel()

</script>

<style scoped>
.drag-handle {
  width: 4px;
  background-color: #d1d5db;
  cursor: col-resize;
  transition: background-color 0.2s ease;
}

.drag-handle:hover {
  background-color: #9ca3af;
}

.drag-handle:active {
  background-color: #6b7280;
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
