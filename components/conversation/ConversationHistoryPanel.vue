<template>
    <div 
      v-if="isOpen"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="close"
    >
      <div class="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <h2 class="text-2xl font-bold mb-4">Conversation History</h2>
        <ul class="space-y-4">
          <li 
            v-for="conversation in conversations" 
            :key="conversation.id"
            class="border border-gray-200 rounded-md p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
            @click="activateConversation(conversation.id)"
          >
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm font-medium">
                {{ formatTimestamp(conversation.createdAt) }}
              </span>
              <span class="text-xs text-gray-500">
                {{ conversation.messages.length }} message(s)
              </span>
            </div>
            <p class="text-sm text-gray-700 truncate">
              {{ getConversationPreview(conversation) }}
            </p>
          </li>
        </ul>
        <button 
          @click="close"
          class="mt-6 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors duration-200"
        >
          Close
        </button>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { defineProps, defineEmits } from 'vue'
  import type { Conversation } from '~/stores/workflowStep'
  
  const props = defineProps<{
    isOpen: boolean
    conversations: Conversation[]
  }>()
  
  const emit = defineEmits<{
    (e: 'close'): void
    (e: 'activate', id: string): void
  }>()
  
  const formatTimestamp = (date: Date) => {
    return date.toLocaleString([], { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }
  
  const getConversationPreview = (conversation: Conversation) => {
    const lastMessage = conversation.messages[conversation.messages.length - 1]
    if (lastMessage) {
      return `${lastMessage.type === 'user' ? 'You' : 'AI'}: ${lastMessage.text.slice(0, 100)}${lastMessage.text.length > 100 ? '...' : ''}`
    }
    return 'No messages yet'
  }
  
  const close = () => {
    emit('close')
  }
  
  const activateConversation = (id: string) => {
    emit('activate', id)
  }
  </script>