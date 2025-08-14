<template>
  <div class="flex flex-col h-full bg-white">
    <!-- Header -->
    <div class="p-4 border-b border-gray-200">
      <h2 class="text-lg font-semibold text-gray-800">Launch Profiles</h2>
      <p class="text-sm text-gray-500">Manage your launch profiles.</p>
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
import { useLaunchProfilePanelOverlayStore } from '~/stores/launchProfilePanelOverlayStore';
import { useSelectedLaunchProfileStore } from '~/stores/selectedLaunchProfileStore';
import CollapsibleSection from '~/components/ui/CollapsibleSection.vue';
import AgentProfileList from '~/components/launchProfiles/AgentProfileList.vue';
import TeamProfileList from '~/components/launchProfiles/TeamProfileList.vue';
import type { TeamLaunchProfile } from '~/types/TeamLaunchProfile';

const router = useRouter();
const agentProfileStore = useAgentLaunchProfileStore();
const teamProfileStore = useAgentTeamLaunchProfileStore();
const panelStore = useLaunchProfilePanelOverlayStore();
const selectedLaunchProfileStore = useSelectedLaunchProfileStore();

const agentProfiles = computed(() => agentProfileStore.activeLaunchProfileList);
const teamProfiles = computed(() => teamProfileStore.activeLaunchProfiles);

const selectAgentProfile = (profileId: string) => {
  agentProfileStore.setActiveLaunchProfile(profileId);
  panelStore.close();
};

const deleteAgentProfile = (profileId: string) => {
  if (confirm("Are you sure you want to delete this agent profile?")) {
    agentProfileStore.deleteLaunchProfile(profileId);
  }
};

const selectTeamProfile = (profileId: string) => {
  selectedLaunchProfileStore.selectProfile(profileId, 'team');
  panelStore.close();
};

const deleteTeamProfile = (profileId: string) => {
  if (confirm("Are you sure you want to delete this team profile?")) {
    teamProfileStore.deleteLaunchProfile(profileId);
  }
};

const relaunchTeamProfile = (profile: TeamLaunchProfile) => {
  // TODO: Implement logic to open the TeamLaunchConfigModal
  alert(`Re-launching team: ${profile.name}`);
  panelStore.close();
};

const startNewLaunchProfile = () => {
  router.push('/agents');
  panelStore.close();
};
</script>
