import { defineStore } from 'pinia';

interface SessionPanelOverlayState {
  isOpen: boolean;
}

export const useAgentSessionPanelOverlayStore = defineStore('agentSessionPanelOverlay', {
  state: (): SessionPanelOverlayState => ({
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
