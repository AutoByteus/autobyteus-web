<template>
  <div class="flex flex-col h-full bg-white group">
    <!-- Header -->
    <div class="p-4 border-b border-gray-200 flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-gray-800">Launch Profiles</h2>
        <p class="text-sm text-gray-500">Manage your launch profiles.</p>
      </div>
      <button 
        @click="closePanel"
        class="p-2 text-gray-400 rounded-md hover:bg-gray-100 hover:text-gray-600 opacity-30 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-200"
        title="Collapse Launch Profiles"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="9" y1="3" x2="9" y2="21"></line>
        </svg>
      </button>
    </div>

    <!-- Profile Lists -->
    <div class="flex-1 overflow-y-auto p-4 space-y-6">
      <!-- Teams Section -->
      <CollapsibleSection title="Teams">
        <TeamProfileList
          :profiles="teamProfiles"
          @select-profile="selectTeamProfile"
          @relaunch-profile="relaunchTeamProfile"
          @delete-profile="deleteTeamProfile"
        />
      </CollapsibleSection>

      <!-- Agents Section -->
      <CollapsibleSection title="Agents">
        <AgentProfileList
          :profiles="agentProfiles"
          @select-profile="selectAgentProfile"
          @delete-profile="deleteAgentProfile"
        />
      </CollapsibleSection>
    </div>

    <!-- Footer Button -->
    <div class="p-4 border-t border-gray-200">
      <button 
        @click="startNewLaunchProfile"
        class="w-full flex items-center justify-center px-4 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
      >
        <span class="i-heroicons-plus-20-solid w-5 h-5 mr-2"></span>
        Create New Profile
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAgentLaunchProfileStore } from '~/stores/agentLaunchProfileStore';
import { useAgentTeamLaunchProfileStore } from '~/stores/agentTeamLaunchProfileStore';
import { useWorkspaceLeftPanelLayoutStore } from '~/stores/workspaceLeftPanelLayoutStore';
import { useSelectedLaunchProfileStore } from '~/stores/selectedLaunchProfileStore';
import CollapsibleSection from '~/components/ui/CollapsibleSection.vue';
import AgentProfileList from '~/components/launchProfiles/AgentProfileList.vue';
import TeamProfileList from '~/components/launchProfiles/TeamProfileList.vue';
import type { TeamLaunchProfile } from '~/types/TeamLaunchProfile';

const router = useRouter();
const agentProfileStore = useAgentLaunchProfileStore();
const teamProfileStore = useAgentTeamLaunchProfileStore();
const layoutStore = useWorkspaceLeftPanelLayoutStore();
const selectedLaunchProfileStore = useSelectedLaunchProfileStore();

const agentProfiles = computed(() => agentProfileStore.activeLaunchProfileList);
const teamProfiles = computed(() => teamProfileStore.activeLaunchProfiles);

const closePanel = () => layoutStore.closePanel('launchProfile');

const selectAgentProfile = (profileId: string) => {
  agentProfileStore.setActiveLaunchProfile(profileId);
  layoutStore.closePanel('launchProfile');
};

const deleteAgentProfile = (profileId: string) => {
  if (confirm("Are you sure you want to delete this agent profile?")) {
    agentProfileStore.deleteLaunchProfile(profileId);
  }
};

const selectTeamProfile = (profileId: string) => {
  selectedLaunchProfileStore.selectProfile(profileId, 'team');
  layoutStore.closePanel('launchProfile');
};

const deleteTeamProfile = (profileId: string) => {
  if (confirm("Are you sure you want to delete this team profile?")) {
    teamProfileStore.deleteLaunchProfile(profileId);
  }
};

const relaunchTeamProfile = (profile: TeamLaunchProfile) => {
  // TODO: Implement logic to open the TeamLaunchConfigModal
  alert(`Re-launching team: ${profile.name}`);
  layoutStore.closePanel('launchProfile');
};

const startNewLaunchProfile = () => {
  router.push('/agents');
  layoutStore.closePanel('launchProfile');
};
</script>
