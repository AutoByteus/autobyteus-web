import { defineStore } from 'pinia';
import { v4 as uuidv4 } from 'uuid';

// Extended to include 'drafts'
type ViewMode = 'marketplace' | 'create' | 'details' | 'drafts';
type MarketplaceViewMode = 'grid' | 'compact';

export interface PromptDraft {
  id: string;
  name: string;
  category: string;
  description: string;
  promptContent: string;
  suitableForModels: string[];
  updatedAt: number;
}

interface PromptEngineeringViewState {
  // --- Existing State Preserved ---
  currentView: ViewMode;
  selectedPromptId: string | null;
  marketplaceSearchQuery: string;
  marketplaceCategoryFilter: string;
  marketplaceNameFilter: string;
  marketplaceViewMode: MarketplaceViewMode;
  
  // --- New Drafts State Added ---
  drafts: PromptDraft[];
  activeDraftId: string | null;
}

export const usePromptEngineeringViewStore = defineStore('promptEngineeringView', {
  state: (): PromptEngineeringViewState => {
    // Logic to restore drafts from localStorage
    let savedDrafts: PromptDraft[] = [];
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('prompt_drafts');
      if (stored) {
        try {
          savedDrafts = JSON.parse(stored);
        } catch (e) {
          console.error('Failed to parse drafts from localStorage', e);
        }
      }
    }

    return {
      // --- Existing Init ---
      currentView: 'marketplace',
      selectedPromptId: null,
      marketplaceSearchQuery: '',
      marketplaceCategoryFilter: '',
      marketplaceNameFilter: '',
      marketplaceViewMode: 'grid',
      
      // --- New Init ---
      drafts: savedDrafts,
      activeDraftId: null,
    };
  },
  actions: {
    // --- Existing Actions Preserved ---
    showMarketplace() {
      this.currentView = 'marketplace';
      this.selectedPromptId = null;
      this.activeDraftId = null; // Ensure we clear draft context
    },
    
    showCreatePromptView() {
      // Enhanced to create a draft instead of just switching view
      this.startNewDraft();
    },

    showPromptDetails(promptId: string) {
      this.selectedPromptId = promptId;
      this.activeDraftId = null; // Ensure we clear draft context
      this.currentView = 'details';
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
    },

    // --- New Draft Actions Added ---
    showDraftsList() {
      this.currentView = 'drafts';
      this.selectedPromptId = null;
      this.activeDraftId = null;
    },

    startNewDraft() {
      const newDraft: PromptDraft = {
        id: uuidv4(),
        name: '',
        category: '',
        description: '',
        promptContent: '',
        suitableForModels: [],
        updatedAt: Date.now(),
      };
      this.drafts.unshift(newDraft);
      this.activeDraftId = newDraft.id;
      this.currentView = 'create';
      this.persistDrafts();
    },

    openDraft(id: string) {
      const draft = this.drafts.find(d => d.id === id);
      if (draft) {
        this.activeDraftId = id;
        this.currentView = 'create';
      }
    },

    updateActiveDraft(updates: Partial<Omit<PromptDraft, 'id' | 'updatedAt'>>) {
      if (!this.activeDraftId) return;
      
      const index = this.drafts.findIndex(d => d.id === this.activeDraftId);
      if (index !== -1) {
        this.drafts[index] = {
          ...this.drafts[index],
          ...updates,
          updatedAt: Date.now(),
        };
        this.persistDrafts();
      }
    },

    deleteDraft(id: string) {
      this.drafts = this.drafts.filter(d => d.id !== id);
      this.persistDrafts();
      
      if (this.activeDraftId === id) {
        this.activeDraftId = null;
        if (this.currentView === 'create') {
          this.currentView = 'drafts';
        }
      }
    },

    persistDrafts() {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('prompt_drafts', JSON.stringify(this.drafts));
      }
    },
  },
  getters: {
    // --- Existing Getters Preserved ---
    isMarketplaceView: (state): boolean => state.currentView === 'marketplace' && !state.selectedPromptId,
    isCreateView: (state): boolean => state.currentView === 'create',
    isDetailsView: (state): boolean => state.selectedPromptId !== null,
    
    // --- New Getters Added ---
    isDraftsView: (state): boolean => state.currentView === 'drafts',
    activeDraft: (state) => state.drafts.find(d => d.id === state.activeDraftId) || null,
    draftCount: (state) => state.drafts.length,
  }
});
