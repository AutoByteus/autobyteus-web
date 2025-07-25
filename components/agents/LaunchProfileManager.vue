<template>
  <div class="flex-1 overflow-auto p-8">
    <div class="max-w-full mx-auto">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">My Launch Profiles</h1>
          <p class="text-gray-500 mt-1">Manage active and past launch profiles.</p>
        </div>
      </div>

      <div v-if="isRestoring" class="text-center py-20">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4"></div>
        <p>Activating profile and preparing workspace...</p>
      </div>
      
      <div v-else>
        <!-- Active Profiles -->
        <div class="mb-12">
          <h2 class="text-xl font-semibold text-gray-800 mb-4">Active Profiles</h2>
          <div v-if="activeLaunchProfiles.length === 0" class="text-center bg-gray-50 rounded-lg py-12 px-6 border border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">No Active Profiles</h3>
            <p class="mt-1 text-sm text-gray-500">Reactivate a profile from your inactive profiles list, or create a new one from the "Local Agents" page.</p>
          </div>
          <div v-else class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <div 
              v-for="profile in activeLaunchProfiles" 
              :key="profile.id"
              class="bg-white rounded-lg border border-gray-200 p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-lg hover:border-blue-400 cursor-pointer"
              @click="openProfile(profile.id)"
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
                <button @click.stop="promptDelete(profile)" class="px-3 py-1.5 text-sm font-semibold text-red-700 bg-red-50 rounded-md hover:bg-red-100 transition-colors">
                  Delete
                </button>
                <button @click="openProfile(profile.id)" class="px-3 py-1.5 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
                  Open
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Inactive Profiles -->
        <div>
          <h2 class="text-xl font-semibold text-gray-800 mb-4">Inactive Profiles</h2>
          <div v-if="inactiveLaunchProfiles.length === 0 && activeLaunchProfiles.length > 0" class="text-center bg-gray-50 rounded-lg py-12 px-6 border border-gray-200">
             <h3 class="text-lg font-medium text-gray-900">No Inactive Profiles</h3>
             <p class="mt-1 text-sm text-gray-500">Your profile history is clear.</p>
          </div>
          <div v-else-if="inactiveLaunchProfiles.length === 0 && activeLaunchProfiles.length === 0" class="text-center bg-gray-50 rounded-lg py-12 px-6 border border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">No Saved Profiles</h3>
            <p class="mt-1 text-sm text-gray-500">
              Create a new launch profile from the "Local Agents" list to see it here.
            </p>
          </div>
          <div v-else class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
             <div 
               v-for="profile in inactiveLaunchProfiles" 
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
                <button @click.stop="promptDelete(profile)" class="px-3 py-1.5 text-sm font-semibold text-red-700 bg-red-50 rounded-md hover:bg-red-100 transition-colors">
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
import { useAgentLaunchProfileStore, type AgentLaunchProfile, LAUNCH_PROFILE_STORAGE_KEY } from '~/stores/agentLaunchProfileStore';
import { useWorkspaceStore } from '~/stores/workspace';
import AgentDeleteConfirmDialog from '~/components/agents/AgentDeleteConfirmDialog.vue';
import ReactivateProfileDialog from '~/components/agents/ReactivateProfileDialog.vue';

const launchProfileStore = useAgentLaunchProfileStore();
const workspaceStore = useWorkspaceStore();
const router = useRouter();

onMounted(() => {
  try {
    const storedProfilesJSON = localStorage.getItem(LAUNCH_PROFILE_STORAGE_KEY);
    const allProfiles = storedProfilesJSON ? JSON.parse(storedProfilesJSON) : {};
    const activeWorkspaceIds = workspaceStore.allWorkspaceIds;
    launchProfileStore.partitionLaunchProfiles(allProfiles, activeWorkspaceIds);
  } catch (error) {
    console.error("Failed to load and partition launch profiles in component:", error);
    launchProfileStore.partitionLaunchProfiles({}, []);
  }
});

const activeLaunchProfiles = computed(() => launchProfileStore.activeLaunchProfileList);
const inactiveLaunchProfiles = computed(() => launchProfileStore.inactiveLaunchProfileList);

const isRestoring = ref(false);
const showDeleteConfirm = ref(false);
const profileToDelete = ref<AgentLaunchProfile | null>(null);

const showReactivateDialog = ref(false);
const profileToReactivate = ref<AgentLaunchProfile | null>(null);

const openProfile = async (profileId: string) => {
  launchProfileStore.setActiveLaunchProfile(profileId);
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
    const success = await launchProfileStore.activateInactiveProfile(profileId, payload);
    
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

const promptDelete = (profile: AgentLaunchProfile) => {
  profileToDelete.value = profile;
  showDeleteConfirm.value = true;
};

const onDeleteConfirmed = () => {
  if (profileToDelete.value) {
    launchProfileStore.deleteLaunchProfile(profileToDelete.value.id);
  }
  onDeleteCanceled();
};

const onDeleteCanceled = () => {
  showDeleteConfirm.value = false;
  profileToDelete.value = null;
};
</script>
