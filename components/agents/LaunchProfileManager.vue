<template>
  <div class="flex-1 overflow-auto p-8">
    <div class="max-w-full mx-auto">
      <div v-if="isRestoring" class="text-center py-20">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4"></div>
        <p>Activating profile and preparing workspace...</p>
      </div>
      
      <div v-else>
        <!-- Teams Section -->
        <div class="mb-12">
          <h2 class="text-xl font-semibold text-gray-800 mb-4">Team Profiles</h2>
          <div v-if="teamProfiles.length === 0" class="text-center bg-gray-50 rounded-lg py-12 px-6 border border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">No Team Profiles</h3>
            <p class="mt-1 text-sm text-gray-500">Create a new team profile from the "Agent Teams" page.</p>
          </div>
          <div v-else class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <!-- TeamProfileCard will go here -->
            <div v-for="profile in teamProfiles" :key="profile.id" class="p-4 border rounded-lg bg-purple-50">
              <p>{{ profile.name }}</p>
              <p class="text-xs">Team: {{ profile.teamDefinition.name }}</p>
              <button @click="relaunchTeam(profile)" class="mt-2 text-sm bg-purple-500 text-white p-2">Re-launch</button>
              <button @click="deleteTeamProfile(profile.id)" class="mt-2 text-sm bg-red-500 text-white p-2">Delete</button>
            </div>
          </div>
        </div>

        <!-- Active Agent Profiles -->
        <div class="mb-12">
          <h2 class="text-xl font-semibold text-gray-800 mb-4">Active Agent Profiles</h2>
          <div v-if="activeAgentProfiles.length === 0" class="text-center bg-gray-50 rounded-lg py-12 px-6 border border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">No Active Agent Profiles</h3>
            <p class="mt-1 text-sm text-gray-500">Reactivate a profile from your inactive profiles list, or create a new one from the "Local Agents" page.</p>
          </div>
          <div v-else class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <div 
              v-for="profile in activeAgentProfiles" 
              :key="profile.id"
              class="bg-white rounded-lg border border-gray-200 p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-lg hover:border-blue-400 cursor-pointer"
              @click="openAgentProfile(profile.id)"
            >
              <div>
                <h3 class="font-semibold text-base text-gray-800 truncate" :title="profile.name">{{ profile.name }}</h3>
                <p class="text-sm text-gray-600 mt-1">
                  Agent: <span class="font-medium">{{ profile.agentDefinition.name }}</span>
                </p>
                <p class="text-xs text-gray-500 mt-2">
                  Created: {{ new Date(profile.createdAt).toLocaleString() }}
                </p>
                <p class="text-xs text-gray-500 mt-1">
                  Workspace Type: <span class="font-mono text-xs bg-gray-100 px-1 rounded">{{ profile.workspaceTypeName }}</span>
                </p>
              </div>

              <div class="mt-6 flex items-center justify-end space-x-3 border-t border-gray-200 pt-4">
                <button @click.stop="promptDeleteAgent(profile)" class="px-3 py-1.5 text-sm font-semibold text-red-700 bg-red-50 rounded-md hover:bg-red-100 transition-colors">
                  Delete
                </button>
                <button @click="openAgentProfile(profile.id)" class="px-3 py-1.5 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
                  Open
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Inactive Agent Profiles -->
        <div>
          <h2 class="text-xl font-semibold text-gray-800 mb-4">Inactive Agent Profiles</h2>
          <div v-if="inactiveAgentProfiles.length === 0 && activeAgentProfiles.length > 0" class="text-center bg-gray-50 rounded-lg py-12 px-6 border border-gray-200">
             <h3 class="text-lg font-medium text-gray-900">No Inactive Agent Profiles</h3>
             <p class="mt-1 text-sm text-gray-500">Your profile history is clear.</p>
          </div>
          <div v-else-if="inactiveAgentProfiles.length === 0 && activeAgentProfiles.length === 0" class="text-center bg-gray-50 rounded-lg py-12 px-6 border border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">No Saved Agent Profiles</h3>
            <p class="mt-1 text-sm text-gray-500">
              Create a new launch profile from the "Local Agents" list to see it here.
            </p>
          </div>
          <div v-else class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
             <div 
               v-for="profile in inactiveAgentProfiles" 
               :key="profile.id"
               class="bg-gray-50 rounded-lg border border-gray-200 p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-lg hover:border-gray-300 cursor-pointer"
               @click="promptReactivate(profile)"
             >
              <div>
                <h3 class="font-semibold text-base text-gray-800 truncate" :title="profile.name">{{ profile.name }}</h3>
                <p class="text-sm text-gray-600 mt-1">
                  Agent: <span class="font-medium">{{ profile.agentDefinition.name }}</span>
                </p>
                <p class="text-xs text-gray-500 mt-2">
                  Created: {{ new Date(profile.createdAt).toLocaleString() }}
                </p>
                <p class="text-xs text-gray-500 mt-1">
                  Workspace Type: <span class="font-mono text-xs bg-gray-100 px-1 rounded">{{ profile.workspaceTypeName }}</span>
                </p>
              </div>

              <div class="mt-6 flex items-center justify-end space-x-3 border-t border-gray-200 pt-4">
                <button @click.stop="promptDeleteAgent(profile)" class="px-3 py-1.5 text-sm font-semibold text-red-700 bg-red-50 rounded-md hover:bg-red-100 transition-colors">
                  Delete
                </button>
                <button @click.stop="promptReactivate(profile)" class="px-3 py-1.5 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
                  Reactivate Profile
                </button>
              </div>
             </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Reactivate Profile Dialog -->
    <ReactivateProfileDialog
      :show="showReactivateDialog"
      :launch-profile="profileToReactivate"
      @confirm="handleReactivateConfirm"
      @cancel="handleReactivateCancel"
    />

    <!-- Delete Confirmation Dialog -->
    <AgentDeleteConfirmDialog
      :show="showDeleteConfirm"
      :item-name="profileToDelete ? profileToDelete.name : ''"
      item-type="Launch Profile"
      title="Delete Launch Profile"
      confirm-text="Delete Profile"
      @confirm="onDeleteConfirmed"
      @cancel="onDeleteCanceled"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useAgentLaunchProfileStore, type AgentLaunchProfile } from '~/stores/agentLaunchProfileStore';
import { useAgentTeamLaunchProfileStore } from '~/stores/agentTeamLaunchProfileStore';
import { useWorkspaceStore } from '~/stores/workspace';
import AgentDeleteConfirmDialog from '~/components/agents/AgentDeleteConfirmDialog.vue';
import ReactivateProfileDialog from '~/components/agents/ReactivateProfileDialog.vue';
import { useSelectedLaunchProfileStore } from '~/stores/selectedLaunchProfileStore';
import type { TeamLaunchProfile } from '~/types/TeamLaunchProfile';

const agentProfileStore = useAgentLaunchProfileStore();
const teamProfileStore = useAgentTeamLaunchProfileStore();
const workspaceStore = useWorkspaceStore();
const selectedLaunchProfileStore = useSelectedLaunchProfileStore();
const router = useRouter();

onMounted(() => {
  // Data is loaded in workspace.vue, we just access it here.
});

const activeAgentProfiles = computed(() => agentProfileStore.activeLaunchProfileList);
const inactiveAgentProfiles = computed(() => agentProfileStore.inactiveLaunchProfileList);
const teamProfiles = computed(() => teamProfileStore.allLaunchProfiles);

const isRestoring = ref(false);
const showDeleteConfirm = ref(false);
const profileToDelete = ref<AgentLaunchProfile | null>(null);

const showReactivateDialog = ref(false);
const profileToReactivate = ref<AgentLaunchProfile | null>(null);

const openAgentProfile = async (profileId: string) => {
  agentProfileStore.setActiveLaunchProfile(profileId);
  await router.push('/workspace');
};

const promptReactivate = (profile: AgentLaunchProfile) => {
  if (isRestoring.value) return;
  profileToReactivate.value = profile;
  showReactivateDialog.value = true;
};

const handleReactivateCancel = () => {
  showReactivateDialog.value = false;
  profileToReactivate.value = null;
};

const handleReactivateConfirm = async (payload: { choice: 'recreate' | 'attach', workspaceId?: string }) => {
  if (!profileToReactivate.value) return;

  isRestoring.value = true;
  showReactivateDialog.value = false;
  
  const profileId = profileToReactivate.value.id;

  try {
    const success = await agentProfileStore.activateInactiveProfile(profileId, payload);
    
    if (success) {
      await router.push('/workspace');
    } else {
      alert('Failed to reactivate launch profile. Please check the console for details.');
    }
  } catch (error) {
    console.error('An error occurred while trying to reactivate the launch profile:', error);
    alert('An unexpected error occurred. Please try again.');
  } finally {
    isRestoring.value = false;
    profileToReactivate.value = null;
  }
};

const promptDeleteAgent = (profile: AgentLaunchProfile) => {
  profileToDelete.value = profile;
  showDeleteConfirm.value = true;
};

const onDeleteConfirmed = () => {
  if (profileToDelete.value) {
    agentProfileStore.deleteLaunchProfile(profileToDelete.value.id);
  }
  onDeleteCanceled();
};

const onDeleteCanceled = () => {
  showDeleteConfirm.value = false;
  profileToDelete.value = null;
};

const deleteTeamProfile = (profileId: string) => {
  if(confirm("Are you sure you want to delete this team profile?")) {
    teamProfileStore.deleteLaunchProfile(profileId);
  }
};

const relaunchTeam = (profile: TeamLaunchProfile) => {
  // This will be implemented with the modal
  alert(`Re-launching team: ${profile.name}`);
};

</script>
