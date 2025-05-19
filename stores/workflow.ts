import { defineStore } from 'pinia';
import type { Workflow, Step, PromptTemplate } from '~/types/workflow';
import { useQuery } from '@vue/apollo-composable';
import { GetWorkflowConfig } from '~/graphql/queries/workspace_queries';
import type { GetWorkflowConfigQuery, GetWorkflowConfigQueryVariables } from '~/generated/graphql';
import { deserializeWorkflow } from '~/utils/JSONParser';
import { useConversationStore } from '~/stores/conversationStore'; // Import conversationStore

interface WorkflowState {
  workflow: Workflow | null;
  selectedStepId: string | null;
  executionStatus: 'Not Started' | 'Running' | 'Completed' | 'Failed';
  executionLogs: string;
}

export const useWorkflowStore = defineStore('workflow', {
  state: (): WorkflowState => ({
    workflow: null,
    selectedStepId: null,
    executionStatus: 'Not Started',
    executionLogs: ''
  }),

  actions: {
    setWorkflow(workflow: Workflow | null) { // Allow setting to null
      this.workflow = workflow;
      if (workflow && Object.keys(workflow.steps).length > 0) {
        // If no step is selected or the selected step is not in the new workflow, select the first one.
        if (!this.selectedStepId || !workflow.steps[this.selectedStepId]) {
          this.selectedStepId = Object.keys(workflow.steps)[0];
        }
      } else if (!workflow) {
        // If workflow is set to null, clear selectedStepId
        this.selectedStepId = null;
      }
      // Note: The actual call to ensure conversation exists will be done in fetchWorkflowConfig's onResult
    },

    setSelectedStepId(stepId: string) {
      if (this.selectedStepId !== stepId) {
        this.selectedStepId = stepId;
        // When a step is selected (e.g., by clicking a tab),
        // conversationStore.ensureConversationForStep might be called by a watcher
        // in WorkflowStepView to ensure consistency if needed, or handled by tab click logic.
        // The primary responsibility for *initial* or *workflow-load-triggered* conversation
        // is now in fetchWorkflowConfig.
      }
    },

    async fetchWorkflowConfig(workspaceId: string) {
      this.executionStatus = 'Not Started';
      this.executionLogs = '';
      
      // To prevent issues with reactive dependencies before new workflow is loaded
      // temporarily set workflow to null.
      // The `setWorkflow(null)` call will also clear selectedStepId.
      if (this.workflow) { // Only if there's an existing workflow
          this.setWorkflow(null); 
      }


      const { onResult, onError } = useQuery<GetWorkflowConfigQuery, GetWorkflowConfigQueryVariables>(
        GetWorkflowConfig,
        { workspaceId }
      );

      onResult((result) => {
        const conversationStore = useConversationStore(); // Get store instance here
        if (result.data?.workflowConfig) {
          try {
            const parsedWorkflow = deserializeWorkflow(result.data.workflowConfig);
            this.setWorkflow(parsedWorkflow); // This will set workflow and potentially selectedStepId

            if (this.selectedStepId) {
              // If a step is now selected (either pre-existing or set by setWorkflow)
              // ensure a conversation exists for it.
              conversationStore.ensureConversationForStep(this.selectedStepId);
            } else if (this.workflow && Object.keys(this.workflow.steps).length > 0) {
              // This case should ideally be covered by setWorkflow setting a default first step.
              // But as a fallback:
              const firstStepId = Object.keys(this.workflow.steps)[0];
              this.selectedStepId = firstStepId; // Explicitly set again if needed
              conversationStore.ensureConversationForStep(firstStepId);
            } else {
              // No workflow or no steps, ensure no conversation is spuriously active
              // or selected if it doesn't match a valid step.
              // This might involve more complex logic in conversationStore if needed.
              // For now, if selectedStepId is null, ensureConversationForStep won't run.
            }

          } catch (err) {
            console.error('Failed to parse workflowConfig', err);
            this.setWorkflow(null); // Ensure clean state on error
            // conversationStore.setSelectedConversationId(null); // Optionally clear selected conversation
          }
        } else {
            this.setWorkflow(null); // No workflow config found
            // conversationStore.setSelectedConversationId(null); // Optionally clear selected conversation
        }
      });

      onError((error) => {
        console.error('Failed to fetch workflowConfig', error);
        this.setWorkflow(null);
        // const conversationStore = useConversationStore();
        // conversationStore.setSelectedConversationId(null); // Optionally clear
      });

      return { onResult, onError };
    },

    updateStepPrompt({ stepId, modelName, newPrompt }: { stepId: string, modelName: string, newPrompt: string }) {
      if (this.workflow && stepId) {
        const step = this.workflow.steps[stepId];
        if (step && step.prompt_templates[modelName]) {
          step.prompt_templates[modelName].template = newPrompt;
        } else {
          console.error(`No prompt template found for model ${modelName} in step ${stepId}`);
        }
      } else {
        console.error('No workflow or stepId provided for updating prompt');
      }
    },

    startExecution() {
      this.executionStatus = 'Running';
      this.executionLogs = 'Execution started...\n';
      setTimeout(() => {
        this.executionStatus = 'Completed';
        this.executionLogs += 'Execution completed successfully.';
      }, 3000);
    },

    resetExecution() {
      this.executionStatus = 'Not Started';
      this.executionLogs = '';
    },
  },

  getters: {
    currentWorkflow: (state): Workflow | null => state.workflow,
    currentSelectedStepId: (state): string | null => state.selectedStepId,
    selectedStep: (state): Step | null => {
      if (state.workflow && state.selectedStepId) {
        return state.workflow.steps[state.selectedStepId];
      }
      return null;
    },
    selectedStepPromptTemplates: (state): Record<string, PromptTemplate> | null => {
      if (state.workflow && state.selectedStepId && state.workflow.steps[state.selectedStepId]) {
        return state.workflow.steps[state.selectedStepId].prompt_templates;
      }
      return null;
    },
    getStepById: (state) => (stepId: string): Step | null => {
        if (state.workflow && state.workflow.steps[stepId]) {
            return state.workflow.steps[stepId];
        }
        return null;
    },
    getStepNameById: (state) => (stepId: string): string => {
        const step = state.workflow?.steps[stepId];
        return step ? step.name : 'Unknown Step';
    }
  },
});
