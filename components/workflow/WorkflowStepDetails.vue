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
      <h4 class="text-lg font-medium text-gray-700">User Requirement:</h4>
      <UserRequirementInput />
    </div>

    <div class="space-y-4 mt-6 h-64 overflow-y-auto">
      <h4 class="text-lg font-medium text-gray-700">AI Responses:</h4>
      <div class="space-y-2 flex flex-col">
        <div 
          v-for="(message, index) in messages" 
          :key="index"
          :class="{
            'self-end bg-blue-100 text-blue-800': message.type === 'user',
            'self-start bg-gray-100 text-gray-800': message.type === 'ai'
          }"
          class="p-3 rounded-lg max-w-md relative"
        >
          <div v-if="message.type === 'user'">
            <div v-if="message.contextFilePaths && message.contextFilePaths.length > 0">
              <strong>Context Files:</strong>
              <ul class="list-disc list-inside">
                <li v-for="path in message.contextFilePaths" :key="path">{{ path }}</li>
              </ul>
            </div>
            <div class="mt-2">
              <strong>User Requirement:</strong>
              <div>{{ message.text }}</div>
            </div>
          </div>
          <div v-else>
            {{ message.text }}
          </div>
          <span class="text-xs text-gray-500 absolute bottom-1 right-2">
            {{ formatTimestamp(message.timestamp) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useWorkflowStore } from '~/stores/workflow'
import { useWorkflowStepStore } from '~/stores/workflowStep'
import PromptEditor from '~/components/prompt/PromptEditor.vue'
import UserRequirementInput from '~/components/workflow/UserRequirementInput.vue'

const workflowStore = useWorkflowStore()
const workflowStepStore = useWorkflowStepStore()

const selectedStep = computed(() => workflowStore.selectedStep)
const messages = computed(() => workflowStepStore.messages)

const updatePrompt = (newPrompt: string) => {
  workflowStore.updateStepPrompt(newPrompt)
}

const formatTimestamp = (date: Date) => {
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

// Watch for changes in the selected step and clear messages when it changes
watch(() => workflowStore.selectedStep, () => {
  workflowStepStore.clearMessagesAfterLastUser()
}, { deep: true })
</script>