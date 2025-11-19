import { defineStore } from 'pinia';

type PanelName = 'launchProfile' | 'fileExplorer';

interface PanelState {
  isOpen: boolean;
}

interface WorkspaceLeftPanelLayoutState {
  panels: Record<PanelName, PanelState>;
}

export const useWorkspaceLeftPanelLayoutStore = defineStore('workspaceLeftPanelLayout', {
  state: (): WorkspaceLeftPanelLayoutState => ({
    panels: {
      launchProfile: { isOpen: true }, // Default to open
      fileExplorer: { isOpen: true },  // Default to open
    },
  }),

  actions: {
    openPanel(panelName: PanelName) {
      if (this.panels[panelName]) {
        this.panels[panelName].isOpen = true;
      }
    },

    closePanel(panelName: PanelName) {
      if (this.panels[panelName]) {
        this.panels[panelName].isOpen = false;
      }
    },

    togglePanel(panelName: PanelName) {
      if (this.panels[panelName]) {
        this.panels[panelName].isOpen = !this.panels[panelName].isOpen;
      }
    },
  },
});
