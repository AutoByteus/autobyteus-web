import { defineStore } from 'pinia';
import { useStorage } from '@vueuse/core';

export type ProfileType = 'agent' | 'team';

interface SelectedProfileState {
  selectedProfileId: string | null;
  selectedProfileType: ProfileType | null;
}

export const useSelectedLaunchProfileStore = defineStore('selectedLaunchProfile', {
  state: (): SelectedProfileState => ({
    selectedProfileId: useStorage('autobyteus-selected-launch-profile-id', null),
    selectedProfileType: useStorage('autobyteus-selected-launch-profile-type', null),
  }),

  actions: {
    selectProfile(profileId: string, profileType: ProfileType) {
      this.selectedProfileId = profileId;
      this.selectedProfileType = profileType;
      console.log(`Selected profile changed to: ${profileType} - ${profileId}`);
    },

    clearSelection() {
      this.selectedProfileId = null;
      this.selectedProfileType = null;
    },
  },
});
