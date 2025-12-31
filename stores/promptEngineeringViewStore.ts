import { defineStore } from 'pinia';
import { v4 as uuidv4 } from 'uuid';

type ViewMode = 'marketplace' | 'create' | 'details' | 'drafts' | 'skills';
type MarketplaceViewMode = 'grid' | 'compact';
type SidebarContext = 'marketplace' | 'drafts' | 'skills';

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
  currentView: ViewMode;
  selectedPromptId: string | null;
  sidebarContext: SidebarContext;
  
  marketplaceSearchQuery: string;
  marketplaceCategoryFilter: string;
  marketplaceNameFilter: string;
  marketplaceViewMode: MarketplaceViewMode;
  
  drafts: PromptDraft[];
  activeDraftId: string | null;
}

export const usePromptEngineeringViewStore = defineStore('promptEngineeringView', {
  state: (): PromptEngineeringViewState => {
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
      currentView: 'marketplace',
      selectedPromptId: null,
      sidebarContext: 'marketplace',
      
      marketplaceSearchQuery: '',
      marketplaceCategoryFilter: '',
      marketplaceNameFilter: '',
      marketplaceViewMode: 'grid',
      
      drafts: savedDrafts,
      activeDraftId: null,
    };
  },
  actions: {
    // --- Navigation ---
    showMarketplace() {
      this.currentView = 'marketplace';
      this.sidebarContext = 'marketplace';
      this.selectedPromptId = null;
      this.activeDraftId = null;
    },
    
    showDraftsList() {
      this.currentView = 'drafts';
      this.sidebarContext = 'drafts';
      this.selectedPromptId = null;
      this.activeDraftId = null;
    },
    
    showSkillsList() {
      this.currentView = 'skills';
      this.sidebarContext = 'skills';
      this.selectedPromptId = null;
      this.activeDraftId = null;
    },

    showCreatePromptView() {
      this.startNewDraft('marketplace');
    },

    showPromptDetails(promptId: string) {
      this.selectedPromptId = promptId;
      this.activeDraftId = null;
      this.currentView = 'details';
      if (!this.sidebarContext) {
        this.sidebarContext = 'marketplace';
      }
    },

    closePromptDetails() {
      this.selectedPromptId = null;
      this.currentView = 'marketplace';
      this.sidebarContext = 'marketplace';
    },

    // --- Draft Management ---
    startNewDraft(origin: SidebarContext = 'marketplace') {
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
      this.sidebarContext = origin;
      
      this.persistDrafts();
    },

    duplicateDraft(prompt: { 
      name: string; 
      category: string; 
      description?: string | null; 
      promptContent: string; 
      suitableForModels?: string | null; 
    }) {
      const newDraft: PromptDraft = {
        id: uuidv4(),
        name: prompt.name, // CHANGED: Removed " (Copy)" suffix to allow versioning
        category: prompt.category,
        description: prompt.description || '',
        promptContent: prompt.promptContent,
        suitableForModels: prompt.suitableForModels 
          ? prompt.suitableForModels.split(',').map(s => s.trim()).filter(Boolean) 
          : [],
        updatedAt: Date.now(),
      };
      
      this.drafts.unshift(newDraft);
      this.activeDraftId = newDraft.id;
      
      this.currentView = 'create';
      // Preserve context
      
      this.persistDrafts();
    },

    openDraft(id: string) {
      const draft = this.drafts.find(d => d.id === id);
      if (draft) {
        this.activeDraftId = id;
        this.currentView = 'create';
        this.sidebarContext = 'drafts';
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
           if (this.sidebarContext === 'drafts') {
             this.showDraftsList();
           } else {
             this.showMarketplace();
           }
        }
      }
    },

    persistDrafts() {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('prompt_drafts', JSON.stringify(this.drafts));
      }
    },

    // --- Filters ---
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
    isDraftsView: (state): boolean => state.currentView === 'drafts',
    isSkillsView: (state): boolean => state.currentView === 'skills',
    
    activeDraft: (state) => state.drafts.find(d => d.id === state.activeDraftId) || null,
    draftCount: (state) => state.drafts.length,
    currentSidebarContext: (state) => state.sidebarContext,

    isDraftEmpty: () => (draft: Partial<PromptDraft>) => {
      return !draft.name?.trim() && 
             !draft.category?.trim() && 
             !draft.description?.trim() && 
             !draft.promptContent?.trim();
    },

    nonEmptyDrafts: (state): PromptDraft[] => {
      return state.drafts.filter(d => 
        d.name?.trim() || 
        d.category?.trim() || 
        d.description?.trim() || 
        d.promptContent?.trim()
      );
    }
  }
});
