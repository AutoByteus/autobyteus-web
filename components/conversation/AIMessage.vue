<template>
  <div>
    <strong>AI:</strong>
    <div>
      <template v-for="(segment, segmentIndex) in parsedSegments" :key="segmentIndex">
        <TextSegment
          v-if="segment.type === 'text'"
          :content="segment.content"
        />
        <FileContentSegment
          v-else-if="segment.type === 'file'"
          :file="segment"
          :conversation-id="conversationId"
          :message-index="messageIndex"
        />
        <BashCommandSegment
          v-else-if="segment.type === 'bash_command'"
          :command="segment.command"
          :description="segment.description"
          :conversation-id="conversationId"
          :message-index="messageIndex"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { AIMessage } from '~/types/conversation';
import type { AIResponseSegment } from '~/utils/aiResponseParser/types';
import { usePrismHighlighter } from '~/composables/usePrismHighlighter';
import TextSegment from '~/components/conversation/segments/TextSegment.vue';
import FileContentSegment from '~/components/conversation/segments/FileContentSegment.vue';
import BashCommandSegment from '~/components/conversation/segments/BashCommandSegment.vue';
import { IncrementalAIResponseParser } from '~/utils/aiResponseParser/incrementalAIResponseParser';

const props = defineProps<{
  message: AIMessage;
  conversationId: string;
  messageIndex: number;
}>();

usePrismHighlighter();

const parsedSegments = ref<AIResponseSegment[]>([]);

const parser = new IncrementalAIResponseParser();

watch(
  () => props.message.chunks,
  (newChunks) => {
    const newSegments = parser.processChunks(newChunks);
    parsedSegments.value = newSegments;
  },
  { immediate: true }
);
</script>

<style scoped>
pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>