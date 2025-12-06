<template>
  <div class="flex flex-col h-full bg-white">
    
    <!-- Detail Header (Sticky) -->
    <div class="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
      <div class="px-6 py-4 flex flex-col gap-4">
        
        <!-- Top Row: Back & Actions -->
        <div class="flex items-center justify-between">
          <!-- Back Icon Button -->
          <button 
            @click="store.clearSelection()"
            class="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            title="Back to List"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-6 h-6">
              <path fill-rule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clip-rule="evenodd" />
            </svg>
          </button>
          
          <!-- Copy Full Log Icon Button (Overlapping Sheets Style) -->
          <button
            @click="copyFullConversation"
            class="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            title="Copy Full Log"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5" />
            </svg>
          </button>
        </div>

        <!-- Title & Metadata Row -->
        <div v-if="conversation">
           <div class="flex flex-wrap items-baseline gap-3 mb-2">
             <h2 class="text-2xl font-bold text-gray-900">
               {{ conversation.agentName || conversation.agentDefinitionId }}
             </h2>
           </div>
           
           <!-- Clean Metadata Strip -->
           <div class="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500">
             <div class="flex items-center gap-1.5" title="Conversation ID">
               <span class="i-heroicons-hashtag-20-solid w-4 h-4 text-gray-400"></span>
               <span class="font-mono text-xs">{{ conversation.id }}</span>
             </div>
             
             <div class="flex items-center gap-1.5" title="Created Date">
               <span class="i-heroicons-calendar-20-solid w-4 h-4 text-gray-400"></span>
               <span>{{ new Date(conversation.createdAt).toLocaleString() }}</span>
             </div>

             <div class="flex items-center gap-1.5" title="Message Count">
                <span class="i-heroicons-chat-bubble-left-right-20-solid w-4 h-4 text-gray-400"></span>
                <span>{{ conversation.messages.length }} Messages</span>
             </div>
           </div>
        </div>
      </div>
    </div>

    <!-- Messages Scroll Area -->
    <div class="flex-1 overflow-auto bg-gray-50/50">
      <div class="w-full px-4 md:px-8 py-8 space-y-6">
        <div v-if="conversation" v-for="(msg, index) in conversation.messages" :key="index">
          <HistoryMessage 
            :msg="msg" 
            @notify="(msg, type) => emit('notify', msg, type)" 
          />
        </div>
        
        <!-- End of History Marker -->
        <div class="flex items-center justify-center pt-8 opacity-50">
          <div class="h-px bg-gray-300 w-24"></div>
          <span class="mx-4 text-xs font-medium text-gray-400 uppercase tracking-widest">End of History</span>
          <div class="h-px bg-gray-300 w-24"></div>
        </div>
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
    emit('notify', 'Full conversation log copied to clipboard', 'success');
  } catch (e) {
    emit('notify', 'Failed to copy log', 'error');
  }
};
</script>
