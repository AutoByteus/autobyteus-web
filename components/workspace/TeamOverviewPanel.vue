<template>
  <div class="p-4 bg-gray-100 h-full">
    <!-- New Unified Container with border and rounding -->
    <div class="flex flex-col h-full bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <!-- Team Members Panel Section -->
      <div 
        class="flex-shrink-0"
        :style="{ height: teamPanelHeight + 'px' }"
        :class="{ 'transition-all duration-300': !isDragging }"
      >
        <TeamMembersPanel />
      </div>
      
      <!-- Thicker, Integrated Separator with darker color -->
      <div 
        class="flex-shrink-0 cursor-row-resize h-3 flex items-center justify-center relative group border-y border-gray-200 bg-gray-100"
        @mousedown="initDrag"
        title="Drag to resize"
      >
        <button 
          @click.stop="toggleMaximize" 
          @mousedown.stop 
          :title="isMaximized ? 'Restore Panel' : 'Maximize Task Board'"
          class="p-1 bg-white rounded-full text-gray-600 hover:text-gray-900 shadow-md hover:shadow-lg transition-all duration-200"
        >
          <svg 
            class="w-3 h-3 transition-transform duration-300" 
            :class="{ 'rotate-180': isMaximized }"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              stroke-linecap="round" 
              stroke-linejoin="round" 
              stroke-width="3" 
              d="M19 9l-7 7-7-7" 
            />
          </svg>
        </button>
      </div>

      <!-- Task Board Display Section -->
      <div class="flex-grow overflow-hidden min-h-0">
        <TaskBoardDisplay />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAgentTeamContextsStore } from '~/stores/agentTeamContextsStore';
import TeamMembersPanel from '~/components/workspace/TeamMembersPanel.vue';
import TaskBoardDisplay from '~/components/workspace/TaskBoardDisplay.vue';
import { useVerticalResize } from '~/composables/useVerticalResize';

const teamContextsStore = useAgentTeamContextsStore();
const activeTeamContext = computed(() => teamContextsStore.activeTeamContext);

const { 
  panelHeight: teamPanelHeight, 
  initDrag,
  isMaximized,
  toggleMaximize,
  isDragging, // Make sure we get the dragging state
} = useVerticalResize({ 
  initialHeight: 320, 
  minHeight: 100, 
  maxHeight: 600 
});
</script>
