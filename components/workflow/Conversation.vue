<template>
    <div class="space-y-4 mb-4">
      <div 
        v-for="(message, index) in conversation.messages" 
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
  </template>
  
  <script setup lang="ts">
  import type { Conversation } from '~/stores/workflowStep'
  
  const props = defineProps<{
    conversation: Conversation
  }>()
  
  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  
  const formatAIResponse = (text: string) => {
    return text.replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-800 text-white p-2 rounded"><code>$1</code></pre>')
  }
  </script>