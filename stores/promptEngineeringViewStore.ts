import { defineStore } from 'pinia';

type ViewMode = 'marketplace' | 'create' | 'details';

interface PromptEngineeringViewState {
  currentView: ViewMode;
  selectedPromptId: string | null;
}

export const usePromptEngineeringViewStore = defineStore('promptEngineeringView', {
  state: (): PromptEngineeringViewState => ({
    currentView: 'marketplace',
    selectedPromptId: null,
  }),
  actions: {
    showMarketplace() {
      this.currentView = 'marketplace';
      this.selectedPromptId = null;
    },
    showCreatePromptView() {
      this.currentView = 'create';
      this.selectedPromptId = null;
    },
    showPromptDetails(promptId: string) {
      this.selectedPromptId = promptId;
      // The view will be 'details' via a getter/watcher on selectedPromptId,
      // or we can set it explicitly. For clarity, let's keep it implicit
      // via the main page component's logic.
    },
    closePromptDetails() {
      this.selectedPromptId = null;
      this.currentView = 'marketplace';
    }
  },
  getters: {
    isMarketplaceView: (state): boolean => state.currentView === 'marketplace' && !state.selectedPromptId,
    isCreateView: (state): boolean => state.currentView === 'create',
    isDetailsView: (state): boolean => state.selectedPromptId !== null,
  }
});
