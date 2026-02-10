import { defineStore } from 'pinia';

export type SelectionType = 'agent' | 'team';

interface AgentSelectionState {
  /** Currently selected instance ID */
  selectedInstanceId: string | null;
  
  /** Type of the selected instance */
  selectedType: SelectionType | null;
}

/**
 * Store for tracking which agent or team instance is currently selected.
 */
export const useAgentSelectionStore = defineStore('agentSelection', {
  state: (): AgentSelectionState => ({
    selectedInstanceId: null,
    selectedType: null,
  }),

  getters: {
    isAgentSelected(): boolean {
        return this.selectedType === 'agent';
    },

    isTeamSelected(): boolean {
        return this.selectedType === 'team';
    },
  },

  actions: {
    /**
     * Select an instance (agent or team).
     */
    selectInstance(instanceId: string, type: SelectionType = 'agent') {
      this.selectedInstanceId = instanceId;
      this.selectedType = type;
    },

    /**
     * Clear the current selection.
     */
    clearSelection() {
      this.selectedInstanceId = null;
      this.selectedType = null;
    },
  },
});
