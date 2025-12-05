<template>
  <div class="flex flex-col gap-2">
    <!-- Message Meta Row -->
    <div class="flex items-center justify-between px-1">
      <div class="flex items-center gap-2">
        <span 
          class="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
          :class="msg.type === 'user' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'"
        >
          {{ msg.type === 'user' ? 'User' : 'Assistant' }}
        </span>
        <span class="text-xs text-gray-400 font-mono">{{ new Date(msg.timestamp).toLocaleTimeString() }}</span>
        
        <!-- Usage Pills -->
        <span v-if="cost > 0" class="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200">
            ${{ cost.toFixed(5) }}
        </span>
      </div>

      <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          @click="isRaw = !isRaw" 
          class="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          :class="{'text-blue-600 bg-blue-50': isRaw}"
          title="Toggle Raw Format"
        >
          <span class="i-heroicons-code-bracket-20-solid w-4 h-4"></span>
        </button>
        <button 
          @click="copyMessage" 
          class="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          title="Copy Message"
        >
          <span class="i-heroicons-document-duplicate-20-solid w-4 h-4"></span>
        </button>
      </div>
    </div>

    <!-- Message Content Card -->
    <div 
      class="rounded-lg border p-4 transition-shadow hover:shadow-sm"
      :class="[
        msg.type === 'user' ? 'bg-white border-blue-200' : 'bg-gray-50 border-gray-200',
        isRaw ? 'bg-gray-900 border-gray-900' : ''
      ]"
    >
      <!-- Raw View -->
      <pre v-if="isRaw" class="whitespace-pre-wrap font-mono text-xs text-gray-300 overflow-x-auto">{{ originalContent }}</pre>
      
      <!-- Standard View -->
      <div v-else class="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap font-mono text-sm leading-relaxed">
        {{ msg.text }}
      </div>

      <!-- Context Attachments (User) -->
      <div v-if="msg.type === 'user' && msg.contextFilePaths?.length" class="mt-4 pt-3 border-t border-gray-200/50">
        <div class="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Context Sources</div>
        <div class="flex flex-wrap gap-2">
          <span 
            v-for="file in msg.contextFilePaths" 
            :key="file.path"
            class="inline-flex items-center px-2 py-1 rounded bg-white border border-gray-200 text-xs text-gray-600 font-mono shadow-sm"
          >
            <span class="i-heroicons-document-text-20-solid w-3 h-3 mr-1.5 text-gray-400"></span>
            {{ file.path }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Message } from '~/types/conversation';

const props = defineProps<{
  msg: Message
}>();

const emit = defineEmits<{
  (e: 'notify', message: string, type: 'success' | 'error'): void
}>();

const isRaw = ref(false);

const cost = computed(() => {
  if (props.msg.type === 'user') return (props.msg as any).promptCost || 0;
  if (props.msg.type === 'ai') return (props.msg as any).completionCost || 0;
  return 0;
});

const originalContent = computed(() => {
  return (props.msg as any).originalMessage || (props.msg as any).text;
});

const copyMessage = async () => {
  try {
    await navigator.clipboard.writeText(originalContent.value);
    emit('notify', 'Message content copied', 'success');
  } catch (e) {
    emit('notify', 'Failed to copy', 'error');
  }
};
</script>
