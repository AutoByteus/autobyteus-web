<template>
  <div class="flex flex-col h-full bg-white">
    <!-- Header -->
    <div class="p-4 border-b border-gray-200">
      <h2 class="text-lg font-semibold text-gray-800">Launch Profiles</h2>
      <p class="text-sm text-gray-500">Manage your launch profiles.</p>
    </div>

    <!-- Profile List -->
    <div class="flex-1 overflow-y-auto p-4">
      <LaunchProfileList
        :launch-profiles="launchProfiles"
        :active-profile-id="activeProfileId"
        @select-profile="selectLaunchProfile"
        @delete-profile="deleteLaunchProfile"
      />
    </div>

    <!-- Footer Button -->
    <div class="p-4 border-t border-gray-200">
      <button 
        @click="startNewLaunchProfile"
        class="w-full flex items-center justify-center px-4 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
      >
        <span class="i-heroicons-plus-20-solid w-5 h-5 mr-2"></span>
        Create New Launch Profile
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useAgentLaunchProfileStore } from '~/stores/agentLaunchProfileStore';
import { useLaunchProfilePanelOverlayStore } from '~/stores/launchProfilePanelOverlayStore';
import LaunchProfileList from './LaunchProfileList.vue';

const router = useRouter();
const profileStore = useAgentLaunchProfileStore();
const panelStore = useLaunchProfilePanelOverlayStore();

const launchProfiles = computed(() => profileStore.activeLaunchProfileList);
const { activeProfileId } = storeToRefs(profileStore);

const selectLaunchProfile = (profileId: string) => {
  profileStore.setActiveLaunchProfile(profileId);
  panelStore.close(); // Close the panel on selection
};

const deleteLaunchProfile = (profileId: string) => {
  profileStore.deleteLaunchProfile(profileId);
};

const startNewLaunchProfile = () => {
  router.push('/agents');
  panelStore.close();
};
</script>
