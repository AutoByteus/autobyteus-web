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
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Team Launch Profiles</h2>
          <p class="text-gray-500 mb-6">Manage saved configurations for running agent teams.</p>
          
          <!-- Active Team Profiles -->
          <div class="mb-10">
            <h3 class="text-xl font-semibold text-gray-800 mb-4">Active Team Profiles</h3>
            <div v-if="activeTeamProfiles.length === 0" class="text-center bg-gray-50 rounded-lg py-12 px-6 border border-gray-200">
              <h3 class="text-lg font-medium text-gray-900">No Active Team Profiles</h3>
              <p class="mt-1 text-sm text-gray-500">Launch a team from an inactive profile, or create a new one from the "Agent Teams" page.</p>
            </div>
            <div v-else class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              <TeamLaunchProfileCard
                v-for="profile in activeTeamProfiles"
                :key="profile.id"
                :profile="profile"
                :is-active="true"
                :instance-count="getInstanceCount(profile.id)"
                @open="handleOpenTeam"
                @delete="promptDeleteTeam"
              />
            </div>
          </div>

          <!-- Inactive Team Profiles -->
          <div>
            <h3 class="text-xl font-semibold text-gray-800 mb-4">Inactive Team Profiles</h3>
            <div v-if="inactiveTeamProfiles.length === 0" class="text-center bg-gray-50 rounded-lg py-12 px-6 border border-gray-200">
              <h3 class="text-lg font-medium text-gray-900">No Inactive Team Profiles</h3>
              <p class="mt-1 text-sm text-gray-500">Your profile history is clear.</p>
            </div>
            <div v-else class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              <TeamLaunchProfileCard
                v-for="profile in inactiveTeamProfiles"
                :key="profile.id"
                :profile="profile"
                :is-active="false"
                :instance-count="0"
                @launch="handleLaunchTeam"
                @delete="promptDeleteTeam"
              />
            </div>
          </div>
        </div>

        <!-- Spacer -->
        <hr class="my-12 border-gray-200">

        <!-- Active Agent Profiles -->
        <div class="mb-12">
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Agent Launch Profiles</h2>
           <p class="text-gray-500 mb-6">Manage saved configurations for running single agents.</p>

          <h3 class="text-xl font-semibold text-gray-800 mb-4">Active Agent Profiles</h3>
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
          <h3 class="text-xl font-semibold text-gray-800 mb-4">Inactive Agent Profiles</h3>
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

    <!-- Team Launch Modal -->
    <TeamLaunchConfigModal 
      v-if="teamToLaunch"
      :show="showTeamLaunchModal"
      :team-definition="teamToLaunch.teamDefinition"
      :existing-profile="teamToLaunch"
      @close="showTeamLaunchModal = false"
      @success="onLaunchSuccess"
    />

    <!-- Reactivate Agent Profile Dialog -->
    <ReactivateAgentProfileDialog
      :show="showReactivateDialog"
      :launch-profile="profileToReactivate"
      @confirm="handleReactivateConfirm"
      @cancel="handleReactivateCancel"
    />

    <!-- Delete Confirmation Dialog -->
    <AgentDeleteConfirmDialog
      :show="showDeleteConfirm"
      :item-name="itemToDelete ? itemToDelete.name : ''"
      :item-type="itemToDeleteType"
      :title="'Delete ' + itemToDeleteType"
      :confirm-text="'Delete ' + itemToDeleteType"
      @confirm="onDeleteConfirmed"
      @cancel="onDeleteCanceled"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useAgentLaunchProfileStore, type AgentLaunchProfile, LAUNCH_PROFILE_STORAGE_KEY } from '~/stores/agentLaunchProfileStore';
import { useAgentTeamLaunchProfileStore } from '~/stores/agentTeamLaunchProfileStore';
import { useAgentTeamContextsStore } from '~/stores/agentTeamContextsStore';
import { useWorkspaceStore } from '~/stores/workspace';
import AgentDeleteConfirmDialog from '~/components/agents/AgentDeleteConfirmDialog.vue';
import ReactivateAgentProfileDialog from '~/components/launchProfiles/ReactivateAgentProfileDialog.vue';
import TeamLaunchConfigModal from '~/components/agentTeams/TeamLaunchConfigModal.vue';
import TeamLaunchProfileCard from '~/components/launchProfiles/TeamLaunchProfileCard.vue';
import type { TeamLaunchProfile } from '~/types/TeamLaunchProfile';

const agentProfileStore = useAgentLaunchProfileStore();
const teamProfileStore = useAgentTeamLaunchProfileStore();
const teamContextsStore = useAgentTeamContextsStore();
const workspaceStore = useWorkspaceStore();
const router = useRouter();

onMounted(() => {
  console.log('LaunchProfileManager mounted, loading and partitioning profiles...');
  
  // Load agent profiles and partition them into active/inactive
  try {
    const storedAgentProfiles = localStorage.getItem(LAUNCH_PROFILE_STORAGE_KEY);
    const allAgentProfiles = storedAgentProfiles ? JSON.parse(storedAgentProfiles) : {};
    agentProfileStore.partitionLaunchProfiles(allAgentProfiles, workspaceStore.allWorkspaceIds);
  } catch (e) {
    console.error("Failed to load and partition agent launch profiles:", e);
    agentProfileStore.partitionLaunchProfiles({}, []);
  }

  // Load team profiles and partition them
  teamProfileStore.loadLaunchProfiles();
});

// --- Agent Profile State ---
const activeAgentProfiles = computed(() => agentProfileStore.activeLaunchProfileList);
const inactiveAgentProfiles = computed(() => agentProfileStore.inactiveLaunchProfileList);
const isRestoring = ref(false);
const profileToReactivate = ref<AgentLaunchProfile | null>(null);
const showReactivateDialog = ref(false);

// --- Team Profile State ---
const activeTeamProfiles = computed(() => teamProfileStore.activeLaunchProfiles);
const inactiveTeamProfiles = computed(() => teamProfileStore.inactiveLaunchProfiles);
const showTeamLaunchModal = ref(false);
const teamToLaunch = ref<TeamLaunchProfile | null>(null);

// --- Shared Delete State ---
const showDeleteConfirm = ref(false);
const itemToDelete = ref<AgentLaunchProfile | TeamLaunchProfile | null>(null);
const itemToDeleteType = ref<'Launch Profile' | 'Team Launch Profile'>('Launch Profile');


// --- Agent Profile Methods ---
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
  itemToDelete.value = profile;
  itemToDeleteType.value = 'Launch Profile';
  showDeleteConfirm.value = true;
};


// --- Team Profile Methods ---
const getInstanceCount = (profileId: string) => {
  return teamContextsStore.allRunningTeamInstancesAcrossProfiles.filter(
    instance => instance.launchProfile.id === profileId
  ).length;
};

const handleOpenTeam = (profile: TeamLaunchProfile) => {
  teamProfileStore.setActiveLaunchProfile(profile.id);
  router.push('/workspace');
};

const handleLaunchTeam = (profile: TeamLaunchProfile) => {
  teamToLaunch.value = profile;
  showTeamLaunchModal.value = true;
};

const onLaunchSuccess = () => {
  showTeamLaunchModal.value = false;
  teamToLaunch.value = null;
  router.push('/workspace');
};

const promptDeleteTeam = (profile: TeamLaunchProfile) => {
  itemToDelete.value = profile;
  itemToDeleteType.value = 'Team Launch Profile';
  showDeleteConfirm.value = true;
};


// --- Shared Delete Methods ---
const onDeleteConfirmed = () => {
  if (!itemToDelete.value) return;
  
  if (itemToDeleteType.value === 'Launch Profile') {
    agentProfileStore.deleteLaunchProfile(itemToDelete.value.id);
  } else {
    teamProfileStore.deleteLaunchProfile(itemToDelete.value.id);
  }
  
  onDeleteCanceled();
};

const onDeleteCanceled = () => {
  showDeleteConfirm.value = false;
  itemToDelete.value = null;
};

</script>
