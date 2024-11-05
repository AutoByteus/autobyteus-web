<template>
  <div>
    <strong>AI:</strong>
    <div>
      <template v-for="(segment, segmentIndex) in handleAIResponse(message.text).segments" :key="segmentIndex">
        <TextSegment
          v-if="segment.type === 'text'"
          :content="segment.content"
        />
        
        <FileContentSegment
          v-else-if="segment.type === 'file_content'"
          :file-group="segment.fileGroup"
          :conversation-id="conversationId"
          :message-index="messageIndex"
        />

        <BashCommandSegment
          v-else-if="segment.type === 'bash_commands'"
          :commands="segment.commands"
          :conversation-id="conversationId"
          :message-index="messageIndex"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { handleAIResponse } from '~/utils/aiResponseParser/aiResponseHandler';
import type { AIMessage } from '~/types/conversation';
import { usePrismHighlighter } from '~/composables/usePrismHighlighter';
import TextSegment from '~/components/conversation/segments/TextSegment.vue';
import FileContentSegment from '~/components/conversation/segments/FileContentSegment.vue';
import BashCommandSegment from '~/components/conversation/segments/BashCommandSegment.vue';
import { computed } from 'vue';

const props = defineProps<{
  message: AIMessage;
  conversationId: string | null;
  messageIndex: number;
}>();

// Initialize Prism highlighter
usePrismHighlighter();

const conversationIdComputed = computed(() => props.conversationId);
</script>

<style scoped>
pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>