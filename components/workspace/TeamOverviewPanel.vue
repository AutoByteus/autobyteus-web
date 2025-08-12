<template>
  <div class="flex flex-col h-full p-4 bg-gray-100 gap-4">
    <!-- Team Members Panel -->
    <div class="flex-shrink-0">
      <TeamMembersPanel />
    </div>
    
    <!-- Task Board Display -->
    <div class="flex-grow overflow-y-auto">
      <TaskBoardDisplay 
        :tasks="activeTeamContext?.taskPlan"
        :statuses="activeTeamContext?.taskStatuses"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAgentTeamContextsStore } from '~/stores/agentTeamContextsStore';
import TeamMembersPanel from '~/components/workspace/TeamMembersPanel.vue';
import TaskBoardDisplay from '~/components/workspace/TaskBoardDisplay.vue';

const teamContextsStore = useAgentTeamContextsStore();
const activeTeamContext = computed(() => teamContextsStore.activeTeamContext);
</script>
