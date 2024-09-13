import { defineStore } from 'pinia'
import type { Workflow } from '~/types/workflow'
import { useQuery } from '@vue/apollo-composable'
import { GetWorkflowConfig } from '~/graphql/queries/workspace_queries'
import type { GetWorkflowConfigQuery, GetWorkflowConfigQueryVariables } from '~/generated/graphql'
import { deserializeWorkflow } from '~/utils/JSONParser'

interface WorkflowState {
  workflow: Workflow | null;
  selectedStepId: string | null;
}

export const useWorkflowStore = defineStore('workflow', {
  state: (): WorkflowState => ({
    workflow: null,
    selectedStepId: null
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
        } else {
          throw new Error('Failed to fetch workflow config')
        }
      } catch (err) {
        console.error('Failed to fetch or parse workflowConfig', err)
        throw err
      }
    }
  },
  getters: {
    currentWorkflow: (state): Workflow | null => state.workflow,
    currentSelectedStepId: (state): string | null => state.selectedStepId
  }
})