import { defineStore } from 'pinia';

interface WorkflowUIState {
  isWorkflowOpen: boolean;
}

export const useWorkflowUIStore = defineStore('workflowUI', {
  state: (): WorkflowUIState => ({
    isWorkflowOpen: false
  }),

  actions: {
    openWorkflow() {
      this.isWorkflowOpen = true;
    },

    closeWorkflow() {
      this.isWorkflowOpen = false;
    },

    toggleWorkflow() {
      this.isWorkflowOpen = !this.isWorkflowOpen;
    }
  }
});
