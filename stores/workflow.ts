import { defineStore } from 'pinia'
import type { Workflow, Step } from '~/types/workflow'
import { useQuery } from '@vue/apollo-composable'
import { GetWorkflowConfig } from '~/graphql/queries/workspace_queries'
import type { GetWorkflowConfigQuery, GetWorkflowConfigQueryVariables } from '~/generated/graphql'
import { deserializeWorkflow } from '~/utils/JSONParser'
import path from 'path'

interface WorkflowState {
  workflow: Workflow | null;
  selectedStepId: string | null;
  executionStatus: 'Not Started' | 'Running' | 'Completed' | 'Failed';
  executionLogs: string;
  contextFilePaths: string[];
  userRequirement: string;
}

export const useWorkflowStore = defineStore('workflow', {
  state: (): WorkflowState => ({
    workflow: null,
    selectedStepId: null,
    executionStatus: 'Not Started',
    executionLogs: '',
    contextFilePaths: [],
    userRequirement: ''
  }),
  actions: {
    setWorkflow(workflow: Workflow) {
      this.workflow = workflow
    },
    setSelectedStepId(stepId: string) {
      this.selectedStepId = stepId
    },
    fetchWorkflowConfig(workspaceRootPath: string) {
      const { onResult, onError } = useQuery<GetWorkflowConfigQuery, GetWorkflowConfigQueryVariables>(
        GetWorkflowConfig,
        { workspaceRootPath }
      )

      onResult((result) => {
        if (result.data?.workflowConfig) {
          try {
            const parsedWorkflow = deserializeWorkflow(result.data.workflowConfig)
            this.setWorkflow(parsedWorkflow)
          } catch (err) {
            console.error('Failed to parse workflowConfig', err)
          }
        }
      })

      onError((error) => {
        console.error('Failed to fetch workflowConfig', error)
      })

      return { onResult, onError }
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
      setTimeout(() => {
        this.executionStatus = 'Completed'
        this.executionLogs += 'Execution completed successfully.'
      }, 3000)
    },
    addContextFilePath(filePath: string) {
      if (!this.contextFilePaths.includes(filePath)) {
        this.contextFilePaths.push(filePath)
      }
    },
    removeContextFilePath(index: number) {
      this.contextFilePaths.splice(index, 1)
    },
    clearAllContextFilePaths() {
      this.contextFilePaths = []
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