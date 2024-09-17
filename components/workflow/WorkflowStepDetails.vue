<template>
  <div v-if="selectedStep" class="space-y-6 p-4 bg-white rounded-lg shadow">
    <h3 class="text-xl font-semibold text-gray-800">Selected Step: {{ selectedStep.name }}</h3>
    
    <div class="space-y-2">
      <h4 class="text-lg font-medium text-gray-700">Edit Prompt:</h4>
      <PromptEditor 
        :prompt="selectedStep.prompt_template.template" 
        @update:prompt="updatePrompt"
      />
    </div>

    <div class="space-y-2">
      <h4 class="text-lg font-medium text-gray-700">Context File Path:</h4>
      <div 
        class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition duration-300"
        @dragover.prevent
        @drop.prevent="onFileDrop"
      >
        <p class="text-gray-600">
          {{ contextFilePath || 'Drag and drop a file here' }}
        </p>
      </div>
    </div>

    <div class="space-y-2">
      <h4 class="text-lg font-medium text-gray-700">User Requirement:</h4>
      <textarea
        v-model="userRequirement"
        @input="updateUserRequirement"
        class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        rows="5"
        placeholder="Enter your requirement here..."
      ></textarea>
    </div>

    <button 
      @click="startExecution" 
      class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-300"
    >
      Start Execution
    </button>

    <p data-test-id="execution-status" class="text-sm text-gray-600">
      Execution Status: {{ executionStatus }}
    </p>
    
    <ExecutionLogsPanel :logs="executionLogs" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useWorkflowStore } from '~/stores/workflow'
import PromptEditor from '~/components/prompt/PromptEditor.vue'
import ExecutionLogsPanel from './ExecutionLogsPanel.vue'

const workflowStore = useWorkflowStore()

const selectedStep = computed(() => workflowStore.selectedStep)
const executionStatus = computed(() => workflowStore.executionStatus)
const executionLogs = computed(() => workflowStore.executionLogs)
const contextFilePath = computed(() => workflowStore.contextFilePath)
const userRequirement = computed(() => workflowStore.userRequirement)

const updatePrompt = (newPrompt: string) => {
  workflowStore.updateStepPrompt(newPrompt)
}

const startExecution = () => {
  workflowStore.startExecution()
}

const onFileDrop = (event: DragEvent) => {
  const file = event.dataTransfer?.files[0]
  if (file) {
    workflowStore.setContextFilePath(file.path)
  }
}

const updateUserRequirement = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  workflowStore.setUserRequirement(target.value)
}
</script>