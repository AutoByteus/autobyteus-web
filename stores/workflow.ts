import { defineStore } from 'pinia'
import type { Workflow, Step } from '~/types/workflow'
import { useQuery } from '@vue/apollo-composable'
import { GetWorkflowConfig } from '~/graphql/queries/workspace_queries'
import type { GetWorkflowConfigQuery, GetWorkflowConfigQueryVariables } from '~/generated/graphql'
import { deserializeWorkflow } from '~/utils/JSONParser'

interface WorkflowState {
  workflow: Workflow | null;
  selectedStepId: string | null;
  executionStatus: 'Not Started' | 'Running' | 'Completed' | 'Failed';
  executionLogs: string;
  contextFilePath: string;
  userRequirement: string;
}

export const useWorkflowStore = defineStore('workflow', {
  state: (): WorkflowState => ({
    workflow: null,
    selectedStepId: null,
    executionStatus: 'Not Started',
    executionLogs: '',
    contextFilePath: '',
    userRequirement: ''
  }),
  actions: {
    setWorkflow(workflow: Workflow) {
      this.workflow = workflow
    },
    setSelectedStepId(stepId: string) {
      this.selectedStepId = stepId
    },
    async fetchWorkflowConfig(workspaceRootPath: string): Promise<void> {
      try {
        const { result } = await useQuery<GetWorkflowConfigQuery, GetWorkflowConfigQueryVariables>(
          GetWorkflowConfig,
          { workspaceRootPath }
        )

        if (result.value?.workflowConfig) {
          const parsedWorkflow = deserializeWorkflow(result.value.workflowConfig)
          this.setWorkflow(parsedWorkflow)
        }
      } catch (err) {
        console.error('Failed to fetch or parse workflowConfig', err)
        throw err
      }
    },
    updateStepPrompt(newPrompt: string) {
      if (this.workflow && this.selectedStepId) {
        const step = this.workflow.steps[this.selectedStepId]
        if (step) {
          step.prompt_template.template = newPrompt
        }
      }
    },
    startExecution() {
      this.executionStatus = 'Running'
      this.executionLogs = 'Execution started...\n'
      // Here you would typically start the actual execution process
      // For now, we'll just simulate it with a timeout
      setTimeout(() => {
        this.executionStatus = 'Completed'
        this.executionLogs += 'Execution completed successfully.'
      }, 3000)
    },
    setContextFilePath(path: string) {
      this.contextFilePath = path
    },
    setUserRequirement(requirement: string) {
      this.userRequirement = requirement
    }
  },
  getters: {
    currentWorkflow: (state): Workflow | null => state.workflow,
    currentSelectedStepId: (state): string | null => state.selectedStepId,
    selectedStep: (state): Step | null => {
      if (state.workflow && state.selectedStepId) {
        return state.workflow.steps[state.selectedStepId]
      }
      return null
    }
  }
})