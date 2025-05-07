<template>
  <!-- Modified container with border and colors for floating effect -->
  <div class="flex justify-center items-center h-screen bg-gray-100 p-1">
    <div class="w-full max-w-7xl h-[calc(100vh-0.5rem)] flex flex-col bg-white border border-gray-300 rounded-xl shadow-md overflow-hidden">
      <!-- Header section with back button and agent info -->
      <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div class="flex items-center">
          <div class="bg-blue-100 p-2 rounded-md mr-3">
            <span 
              v-if="agent.icon" 
              :class="agent.icon + ' w-5 h-5 text-blue-600'"
            ></span>
            <span 
              v-else 
              class="i-heroicons-cpu-chip-20-solid w-5 h-5 text-blue-600"
            ></span>
          </div>
          <div>
            <h2 class="font-medium text-gray-900">{{ agent.name }}</h2>
            <p class="text-sm text-gray-500">{{ agent.role || 'AI Assistant' }}</p>
          </div>
        </div>
        
        <!-- Back button -->
        <button 
          @click="$emit('back')" 
          class="flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
          </svg>
          <span class="ml-1 text-sm font-medium">Back</span>
        </button>
      </div>
      
      <!-- Simple messages area - takes up most of the space -->
      <div class="flex-1 overflow-y-auto px-6 pt-6 pb-4" ref="messagesContainer">
        <div class="max-w-4xl mx-auto space-y-6">
          <template v-for="message in messages" :key="message.id">
            <!-- User messages -->
            <div v-if="message.sender === 'user'" class="flex justify-end">
              <div class="bg-blue-600 text-white rounded-lg p-4 max-w-md">
                <p>{{ message.text }}</p>
              </div>
            </div>
            
            <!-- Agent messages -->
            <div v-else class="flex items-start">
              <div class="bg-gray-200 rounded-lg p-4 max-w-md">
                <p class="text-gray-900">{{ message.text }}</p>
              </div>
            </div>
          </template>

          <!-- Agent typing indicator -->
          <div v-if="isTyping" class="flex items-start">
            <div class="bg-gray-200 rounded-lg p-4">
              <div class="flex space-x-2">
                <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
                <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 100ms"></div>
                <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 200ms"></div>
              </div>
            </div>
          </div>

          <!-- Tool usage indicator - simplified -->
          <div v-if="isCallingTools" class="flex items-start">
            <div class="bg-blue-50 rounded-lg p-4">
              <p class="text-blue-700">Using {{ getToolName() }}...</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Simple input - no dividing lines -->
      <div class="px-6 pb-6">
        <div class="max-w-4xl mx-auto">
          <div class="relative">
            <input
              type="text"
              v-model="userInput"
              @keydown.enter="sendMessage"
              placeholder="Type your message..."
              class="w-full px-4 py-3 pr-12 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
            <button
              @click="sendMessage"
              :disabled="!userInput.trim() || isTyping"
              class="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-700 disabled:text-gray-400"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import type { LocalAgent, MarketplaceAgent } from '~/stores/agents';
import { useChatStore } from '~/stores/chat';

const props = defineProps({
  agent: {
    type: Object as () => LocalAgent | MarketplaceAgent,
    required: true
  }
});

const emit = defineEmits(['back']);

// Store
const chatStore = useChatStore();

// State
const userInput = ref('');
const isTyping = ref(false);
const isCallingTools = ref(false);
const messagesContainer = ref(null);

// Get conversation for this agent
const messages = computed(() => {
  return chatStore.getConversation(props.agent.id);
});

// Scroll to bottom when new messages are added
watch(messages, () => {
  nextTick(() => {
    scrollToBottom();
  });
}, { deep: true });

// Scroll to bottom when typing status changes
watch([isTyping, isCallingTools], () => {
  nextTick(() => {
    scrollToBottom();
  });
});

function scrollToBottom() {
  if (messagesContainer.value) {
    const container = messagesContainer.value as HTMLElement;
    container.scrollTop = container.scrollHeight;
  }
}

// Simplified getter
const getToolName = () => {
  if ('tools' in props.agent && props.agent.tools && props.agent.tools.length > 0) {
    return props.agent.tools[Math.floor(Math.random() * props.agent.tools.length)];
  }
  return 'tools';
};

// Methods
const sendMessage = () => {
  if (!userInput.value.trim() || isTyping.value) return;
  
  // Add user message to the store
  chatStore.addMessage({
    agentId: props.agent.id,
    sender: 'user',
    text: userInput.value
  });
  
  // Clear input immediately
  const userMessage = userInput.value;
  userInput.value = '';
  
  // Simulate typing delay
  isTyping.value = true;
  setTimeout(() => {
    isTyping.value = false;
    // Simulate tool usage
    isCallingTools.value = true;
    setTimeout(() => {
      isCallingTools.value = false;
      // Show response
      chatStore.addMessage({
        agentId: props.agent.id,
        sender: 'agent',
        text: getResponseMessage(userMessage)
      });
    }, 1500);
  }, 1000);
};

const getResponseMessage = (userMessage: string) => {
  // Check if user message contains specific keywords to generate contextual responses
  const lowerMessage = userMessage.toLowerCase();
  
  // Code-related responses
  if (lowerMessage.includes('code') || lowerMessage.includes('programming') || lowerMessage.includes('function')) {
    return "I've analyzed your code and found some optimization opportunities. Would you like me to explain the suggested improvements?";
  }
  
  // Data-related responses
  if (lowerMessage.includes('data') || lowerMessage.includes('analyze') || lowerMessage.includes('statistics')) {
    return "I've examined the data and identified some interesting patterns. The key insights are: higher conversion rates on weekends, increased engagement with video content, and a strong correlation between price and quality perception.";
  }
  
  // Text-related responses
  if (lowerMessage.includes('text') || lowerMessage.includes('summarize') || lowerMessage.includes('article')) {
    return "I've created a concise summary of the text while preserving all key information. The main points are clearly highlighted and organized for easy understanding.";
  }
  
  // Agent-specific default responses
  const agent = props.agent;
  
  if (agent.role) {
    if (agent.role.includes('Code') || agent.role.includes('Coding')) {
      return "I've analyzed your request from a coding perspective. I can help with implementation, debugging, or explaining algorithms. What specific coding assistance do you need?";
    } else if (agent.role.includes('Data') || agent.role.includes('Analyst')) {
      return "Based on my analysis, I can provide insights about the data patterns, statistical significance, and visualization options. Would you like me to focus on any particular aspect?";
    } else if (agent.role.includes('Content') || agent.role.includes('Text')) {
      return "I've processed the content and can provide a summary, key points extraction, or formatting assistance. Let me know what you need specifically.";
    }
  }
  
  return "I understand your request. I'm here to help you with that. Can you provide more details so I can assist you better?";
};

onMounted(() => {
  // Ensure the chat container scrolls to the bottom on initial load
  scrollToBottom();
});
</script>
