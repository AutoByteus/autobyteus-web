import { defineStore } from 'pinia'
import { Workflow } from '~/types/Workflow'

export const useWorkflowStore = defineStore('workflow', {
  state: () => ({
    workflow: null as Workflow | null,
    selectedStepId: null as string | null
  }),
  actions: {
    setWorkflow(workflow: Workflow) {
      this.workflow = workflow
    },
    setSelectedStepId(stepId: string) {
      this.selectedStepId = stepId
    }
  }
})