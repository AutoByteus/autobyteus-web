import { defineStore } from 'pinia';

export type ProfileType = 'agent' | 'team';

interface SelectedLaunchProfileState {
  selectedProfileId: string | null;
  selectedProfileType: ProfileType | null;
}

export const useSelectedLaunchProfileStore = defineStore('selectedLaunchProfile', {
  state: (): SelectedLaunchProfileState => ({
    selectedProfileId: null,
    selectedProfileType: null,
  }),
  actions: {
    selectProfile(profileId: string, profileType: ProfileType) {
      this.selectedProfileId = profileId;
      this.selectedProfileType = profileType;
    },
    clearSelection() {
      this.selectedProfileId = null;
      this.selectedProfileType = null;
    },
  },
});
