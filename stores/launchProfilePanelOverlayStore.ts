import { defineStore } from 'pinia';

interface LaunchProfilePanelOverlayState {
  isOpen: boolean;
}

export const useLaunchProfilePanelOverlayStore = defineStore('launchProfilePanelOverlay', {
  state: (): LaunchProfilePanelOverlayState => ({
    isOpen: false,
  }),

  actions: {
    open() {
      this.isOpen = true;
    },

    close() {
      this.isOpen = false;
    },

    toggle() {
      this.isOpen = !this.isOpen;
    },
  },
});
