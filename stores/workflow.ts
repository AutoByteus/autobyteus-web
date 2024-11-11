import { defineStore } from 'pinia';
import type { Workflow, Step, PromptTemplate } from '~/types/workflow';
import { useQuery } from '@vue/apollo-composable';
import { GetWorkflowConfig } from '~/graphql/queries/workspace_queries';
import type { GetWorkflowConfigQuery, GetWorkflowConfigQueryVariables } from '~/generated/graphql';
import { deserializeWorkflow } from '~/utils/JSONParser';
import { useConversationStore } from '~/stores/conversationStore';

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
    setWorkflow(workflow: Workflow) {
      this.workflow = workflow;
    },

    setSelectedStepId(stepId: string) {
      const conversationStore = useConversationStore();
      const previousStepId = this.selectedStepId;

      // Only proceed if selecting a different step
      if (previousStepId !== stepId) {
        this.selectedStepId = stepId;
        // Always create a new temporary conversation when switching steps
        conversationStore.createTemporaryConversation();
      }
    },

    async fetchWorkflowConfig(workspaceId: string) {
      this.executionStatus = 'Not Started';
      this.executionLogs = '';
      const { onResult, onError } = useQuery<GetWorkflowConfigQuery, GetWorkflowConfigQueryVariables>(
        GetWorkflowConfig,
        { workspaceId }
      );

      onResult((result) => {
        if (result.data?.workflowConfig) {
          try {
            const parsedWorkflow = deserializeWorkflow(result.data.workflowConfig);
            this.setWorkflow(parsedWorkflow);
          } catch (err) {
            console.error('Failed to parse workflowConfig', err);
          }
        }
      });

      onError((error) => {
        console.error('Failed to fetch workflowConfig', error);
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
      if (state.workflow && state.selectedStepId) {
        return state.workflow.steps[state.selectedStepId].prompt_templates;
      }
      return null;
    },
  },
});