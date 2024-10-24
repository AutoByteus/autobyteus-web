<!-- File: autobyteus-web/components/conversation/ConversationList.vue -->
<template>
    <div class="mb-4">
      <ul class="space-y-2">
        <li 
          v-for="conversation in conversations" 
          :key="conversation.id"
          :class="[
            'p-2 rounded-md cursor-pointer transition-colors duration-200',
            activeConversationId === conversation.id ? 'bg-blue-100' : 'bg-gray-100 hover:bg-gray-200'
          ]"
          @click="activateConversation(conversation.id)"
        >
          <div class="flex justify-between items-center">
            <span class="text-sm font-medium">
              {{ formatTimestamp(conversation.createdAt) }}
            </span>
            <button 
              @click.stop="deleteConversation(conversation.id)"
              class="text-red-500 hover:text-red-700"
              title="Delete conversation"
            >
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
          <p class="text-xs text-gray-500 mt-1 truncate">
            {{ getConversationPreview(conversation) }}
          </p>
        </li>
      </ul>
    </div>
  </template>
  
  <script setup lang="ts">
  import type { Conversation } from '~/types/conversation'
  
  const props = defineProps<{
    conversations: Conversation[]
    activeConversationId: string | null
  }>()
  
  const emit = defineEmits<{
    (e: 'activate', id: string): void
    (e: 'delete', id: string): void
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
      return `${lastMessage.type === 'user' ? 'You' : 'AI'}: ${lastMessage.text.slice(0, 50)}${lastMessage.text.length > 50 ? '...' : ''}`
    }
    return 'No messages yet'
  }
  
  const activateConversation = (id: string) => {
    emit('activate', id)
  }
  
  const deleteConversation = (id: string) => {
    emit('delete', id)
  }
</script>