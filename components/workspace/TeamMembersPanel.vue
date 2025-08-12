<template>
  <div class="flex flex-col bg-gray-50 text-gray-800 rounded-lg border border-gray-200 overflow-hidden">
    <!-- Header -->
    <div class="p-4 border-b border-gray-200 flex-shrink-0">
      <h3 class="text-base font-semibold text-gray-900">Team Members</h3>
      <p v-if="teamName" class="text-sm text-gray-500 truncate" :title="teamName">{{ teamName }}</p>
    </div>

    <!-- Member List -->
    <div class="flex-1 overflow-y-auto p-2 space-y-1">
      <div v-if="teamMembers.length === 0" class="text-center text-sm text-gray-500 pt-8">
        No active team members.
      </div>
      <div
        v-for="member in teamMembers"
        :key="member.state.agentId"
        @click="selectMember(member.state.agentId)"
        class="p-3 rounded-lg cursor-pointer transition-colors duration-150 border"
        :class="focusedMemberName === member.state.agentId
          ? 'bg-indigo-100 border-indigo-300 shadow-sm'
          : 'bg-white border-gray-200 hover:bg-gray-100 hover:border-gray-300'"
      >
        <div class="flex justify-between items-center">
          <p class="font-medium text-sm truncate" :title="member.state.agentId">{{ member.state.agentId }}</p>
          <span v-if="isCoordinator(member.state.agentId)" class="text-xs font-bold text-yellow-800 bg-yellow-200 px-2 py-0.5 rounded-full">
            Coord
          </span>
        </div>
        <div class="mt-2">
          <AgentStatusDisplay :phase="member.state.currentPhase" />
        </div>
      </div>
    </div>

    <!-- Footer Actions -->
    <div class="p-4 border-t border-gray-200 flex-shrink-0">
      <button
        @click="promptTerminateTeam"
        :disabled="isTeamInstanceTemporary"
        class="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white font-semibold text-sm rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span class="i-heroicons-stop-circle-20-solid w-5 h-5 mr-2"></span>
        Terminate Team
      </button>
    </div>
    
    <!-- Delete Confirmation Dialog -->
    <AgentDeleteConfirmDialog
      :show="showTerminateConfirm"
      :item-name="teamName"
      item-type="Team Instance"
      title="Terminate Team Instance"
      confirm-text="Terminate"
      @confirm="onTerminateConfirmed"
      @cancel="onTerminateCanceled"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAgentTeamContextsStore } from '~/stores/agentTeamContextsStore';
import { useAgentTeamRunStore } from '~/stores/agentTeamRunStore';
import AgentStatusDisplay from '~/components/workspace/AgentStatusDisplay.vue';
import AgentDeleteConfirmDialog from '~/components/agents/AgentDeleteConfirmDialog.vue';

const teamContextsStore = useAgentTeamContextsStore();
const teamRunStore = useAgentTeamRunStore();

const showTerminateConfirm = ref(false);

const teamMembers = computed(() => teamContextsStore.teamMembers);
const focusedMemberName = computed(() => teamContextsStore.focusedMemberContext?.state.agentId);
const teamName = computed(() => teamContextsStore.activeTeamContext?.launchProfile.name || 'this team');
const coordinatorName = computed(() => teamContextsStore.activeTeamContext?.launchProfile.teamDefinition.coordinatorMemberName);

const isTeamInstanceTemporary = computed(() => {
  return teamContextsStore.activeTeamContext?.teamId.startsWith('temp-') ?? false;
});

const isCoordinator = (memberName: string) => {
  return memberName === coordinatorName.value;
};

const selectMember = (memberName: string) => {
  teamContextsStore.setFocusedMember(memberName);
};

const promptTerminateTeam = () => {
  showTerminateConfirm.value = true;
};

const onTerminateConfirmed = () => {
  teamRunStore.terminateActiveTeam();
  showTerminateConfirm.value = false;
};

const onTerminateCanceled = () => {
  showTerminateConfirm.value = false;
};
</script>
