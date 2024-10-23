<template>
      <div class="space-y-6 p-4">
        <div
          v-for="(message, index) in conversation.messages"
          :key="message.timestamp + '-' + message.type + '-' + index"
          class="flex"
          :class="[
            message.type === 'user' ? 'justify-end' : 'justify-start'
          ]"
        >
          <div
            class="relative max-w-2xl rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-4"
            :class="[
              message.type === 'user' 
                ? 'bg-blue-50 text-blue-900' 
                : 'bg-white border border-gray-200 text-gray-900'
            ]"
          >
            <UserMessage
              v-if="message.type === 'user'"
              :message="message"
              class="prose max-w-none"
            />
            <AIMessage
              v-else
              :message="message"
              :conversation-id="conversation.id"
              :message-index="index"
              class="prose max-w-none"
            />
            <span 
              class="absolute bottom-2 right-4 text-xs text-gray-500"
              :class="{ 'text-blue-400': message.type === 'user' }"
            >
              {{ formatTimestamp(message.timestamp) }}
            </span>
          </div>
        </div>
      </div>
    </template>
    
    <script setup lang="ts">
    import { ref } from 'vue';
    import type { Conversation } from '~/types/conversation';
    import UserMessage from '~/components/conversation/UserMessage.vue';
    import AIMessage from '~/components/conversation/AIMessage.vue';
    
    const props = defineProps<{
      conversation: Conversation;
    }>();
    
    const formatTimestamp = (date: Date) => {
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    };
    </script>
    
    <style>
    .prose {
      max-width: 65ch;
      line-height: 1.6;
    }
    
    .prose p:last-child {
      margin-bottom: 0;
    }
    </style>