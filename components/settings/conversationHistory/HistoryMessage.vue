<template>
  <div class="flex flex-col gap-1.5">
    
    <!-- Header Row -->
    <div class="flex items-center justify-between px-1">
      <div class="flex items-center gap-3">
        <!-- Role Badge -->
        <div 
          class="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider border"
          :class="msg.type === 'user' 
            ? 'bg-blue-50 text-blue-700 border-blue-100' 
            : 'bg-emerald-50 text-emerald-700 border-emerald-100'"
        >
          <span 
            class="w-1.5 h-1.5 rounded-full"
            :class="msg.type === 'user' ? 'bg-blue-500' : 'bg-emerald-500'"
          ></span>
          {{ msg.type === 'user' ? 'User' : 'Assistant' }}
        </div>

        <span class="text-xs text-gray-400 font-mono">{{ new Date(msg.timestamp).toLocaleTimeString() }}</span>
        
        <!-- Cost Pill -->
        <span v-if="cost > 0" class="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
            €{{ cost.toFixed(5) }}
        </span>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-1">
        <button 
          @click="copyMessage" 
          class="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-gray-100 transition-colors"
          title="Copy Content"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
             <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Message Content Container -->
    <div 
      class="relative rounded-lg border shadow-sm overflow-hidden transition-all duration-200"
      :class="[
        msg.type === 'user' 
          ? 'bg-white border-blue-100' 
          : 'bg-white border-gray-200'
      ]"
    >
      <!-- Removed Color Strip div here -->

      <!-- Adjusted padding: pl-5 -> px-4 -->
      <div class="px-4 py-4">
        <!-- Content View (Always Raw/Mono style) -->
        <div class="prose prose-sm max-w-none text-gray-800 break-words leading-relaxed font-normal">
          <div class="whitespace-pre-wrap font-mono text-sm">{{ msg.text }}</div>
        </div>

        <!-- Context Attachments (User) -->
        <div v-if="msg.type === 'user' && msg.contextFilePaths?.length" class="mt-4 pt-3 border-t border-gray-100">
          <div class="flex items-center gap-2 mb-2">
            <span class="i-heroicons-paper-clip-20-solid w-3 h-3 text-gray-400"></span>
            <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Context Sources</span>
          </div>
          <div class="flex flex-wrap gap-2">
            <span 
              v-for="file in msg.contextFilePaths" 
              :key="file.path"
              class="inline-flex items-center px-2 py-1 rounded bg-gray-50 border border-gray-200 text-xs text-gray-600 font-mono"
            >
              {{ file.path }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Message } from '~/types/conversation';

const props = defineProps<{
  msg: Message
}>();

const emit = defineEmits<{
  (e: 'notify', message: string, type: 'success' | 'error'): void
}>();

const cost = computed(() => {
  if (props.msg.type === 'user') return (props.msg as any).promptCost || 0;
  if (props.msg.type === 'ai') return (props.msg as any).completionCost || 0;
  return 0;
});

const copyMessage = async () => {
  try {
    // Copy the text content shown in the UI
    await navigator.clipboard.writeText(props.msg.text);
    emit('notify', 'Message content copied', 'success');
  } catch (e) {
    emit('notify', 'Failed to copy', 'error');
  }
};
</script>
