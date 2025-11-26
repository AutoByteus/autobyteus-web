import { defineStore } from 'pinia';

type ViewMode = 'marketplace' | 'create' | 'details';
type MarketplaceViewMode = 'grid' | 'compact';

interface PromptEngineeringViewState {
  currentView: ViewMode;
  selectedPromptId: string | null;
  // Marketplace persistent state
  marketplaceSearchQuery: string;
  marketplaceCategoryFilter: string;
  marketplaceNameFilter: string;
  marketplaceViewMode: MarketplaceViewMode;
}

export const usePromptEngineeringViewStore = defineStore('promptEngineeringView', {
  state: (): PromptEngineeringViewState => ({
    currentView: 'marketplace',
    selectedPromptId: null,
    marketplaceSearchQuery: '',
    marketplaceCategoryFilter: '',
    marketplaceNameFilter: '',
    marketplaceViewMode: 'grid',
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
    },
    closePromptDetails() {
      this.selectedPromptId = null;
      this.currentView = 'marketplace';
    },
    resetMarketplaceFilters() {
      this.marketplaceSearchQuery = '';
      this.marketplaceCategoryFilter = '';
      this.marketplaceNameFilter = '';
      this.marketplaceViewMode = 'grid';
    }
  },
  getters: {
    isMarketplaceView: (state): boolean => state.currentView === 'marketplace' && !state.selectedPromptId,
    isCreateView: (state): boolean => state.currentView === 'create',
    isDetailsView: (state): boolean => state.selectedPromptId !== null,
  }
});
