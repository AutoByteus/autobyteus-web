<template>
  <div class="flex flex-col">
    
    <!-- Detail Header -->
    <div class="p-4 border-b border-gray-200 bg-white flex flex-col gap-4">
      <div class="flex items-center justify-between">
        <button 
          @click="store.clearSelection()"
          class="flex items-center text-gray-600 hover:text-gray-900 transition-colors group"
        >
          <span class="p-1 rounded-full group-hover:bg-gray-100 mr-2 transition-colors">
            <span class="i-heroicons-arrow-left-20-solid w-5 h-5"></span>
          </span>
          <span class="font-medium">Back to History</span>
        </button>
        
        <div class="flex items-center gap-2">
          <button
            @click="copyFullConversation"
            class="flex items-center px-3 py-1.5 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
          >
            <span class="i-heroicons-clipboard-document-list-20-solid w-4 h-4 mr-2 text-gray-500"></span>
            Copy Full Log
          </button>
        </div>
      </div>

      <!-- Metadata Banner -->
      <div v-if="conversation" class="flex flex-wrap items-center gap-4 text-sm bg-gray-50 p-3 rounded-md border border-gray-100">
        <div class="flex items-center">
          <!-- Changed Label from Agent to Name -->
          <span class="text-gray-500 mr-2">Name:</span>
          <!-- Display Agent Name if available, fallback to Definition ID -->
          <span class="font-medium text-gray-900">{{ conversation.agentName || conversation.agentDefinitionId }}</span>
        </div>
        <div class="w-px h-4 bg-gray-300"></div>
        <div class="flex items-center">
          <span class="text-gray-500 mr-2">ID:</span>
          <span class="font-mono text-xs text-gray-600">{{ conversation.id }}</span>
        </div>
        <div class="w-px h-4 bg-gray-300"></div>
        <div class="flex items-center">
          <span class="text-gray-500 mr-2">Date:</span>
          <span class="text-gray-900">{{ new Date(conversation.createdAt).toLocaleString() }}</span>
        </div>
        <div class="ml-auto flex items-center gap-2">
          <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
            {{ conversation.messages.length }} Messages
          </span>
        </div>
      </div>
    </div>

    <!-- Messages Area (Removed fixed height/overflow) -->
    <div class="p-6 bg-white space-y-6">
      <div v-if="conversation" v-for="(msg, index) in conversation.messages" :key="index" class="group">
        <HistoryMessage 
          :msg="msg" 
          @notify="(msg, type) => emit('notify', msg, type)" 
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRawConversationHistoryStore } from '~/stores/rawConversationHistory';
import HistoryMessage from './HistoryMessage.vue';

const store = useRawConversationHistoryStore();
const conversation = computed(() => store.selectedConversation);

const emit = defineEmits<{
  (e: 'notify', message: string, type: 'success' | 'error'): void
}>();

const copyFullConversation = async () => {
  if (!conversation.value) return;
  const text = store.getFormattedConversationText(conversation.value);
  try {
    await navigator.clipboard.writeText(text);
    emit('notify', 'Full conversation log copied', 'success');
  } catch (e) {
    emit('notify', 'Failed to copy log', 'error');
  }
};
</script>
