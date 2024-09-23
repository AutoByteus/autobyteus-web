<template>
  <div v-if="selectedStep" class="flex flex-col h-full">
    <div class="flex-grow overflow-y-auto">
      <h3 class="text-2xl font-bold text-gray-800 mb-4">Selected Step: {{ selectedStep.name }}</h3>
      
      <div class="mb-4">
        <PromptEditor 
          :prompt="selectedStep.prompt_template.template" 
          @update:prompt="updatePrompt"
          @collapseChanged="handleCollapseChanged"
        />
      </div>

      <div class="space-y-4 mb-4">
        <h4 class="text-lg font-medium text-gray-700">Conversation</h4>
        <div class="space-y-4">
          <div 
            v-for="(message, index) in messages" 
            :key="index"
            :class="[
              'p-3 rounded-lg max-w-3/4 relative shadow-sm hover:shadow-md transition-shadow duration-200',
              message.type === 'user' ? 'ml-auto bg-blue-100 text-blue-800' : 'mr-auto bg-gray-100 text-gray-800'
            ]"
          >
            <div v-if="message.type === 'user'">
              <div v-if="message.contextFilePaths && message.contextFilePaths.length > 0">
                <strong>Context Files:</strong>
                <ul class="list-disc list-inside">
                  <li v-for="path in message.contextFilePaths" :key="path" class="truncate">{{ path }}</li>
                </ul>
              </div>
              <div class="mt-2">
                <strong>User:</strong>
                <div>{{ message.text }}</div>
              </div>
            </div>
            <div v-else>
              <strong>AI:</strong>
              <div v-html="formatAIResponse(message.text)"></div>
            </div>
            <span class="text-xs text-gray-500 absolute bottom-1 right-2">
              {{ formatTimestamp(message.timestamp) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-auto border-t border-gray-200 p-4 bg-white">
      <h4 class="text-lg font-medium text-gray-700 mb-2">New Message</h4>
      <UserRequirementInput />
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

const handleCollapseChanged = (isCollapsed: boolean) => {
  console.log('Prompt editor collapsed:', isCollapsed)
}

const formatTimestamp = (date: Date) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const formatAIResponse = (text: string) => {
  return text.replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-800 text-white p-2 rounded"><code>$1</code></pre>')
}

watch(() => workflowStore.selectedStep, () => {
  workflowStepStore.clearMessagesAfterLastUser()
}, { deep: true })
</script>