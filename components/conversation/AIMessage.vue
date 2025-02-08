<template>
  <div>
    <strong>AI:</strong>
    <div>
      <template v-for="(segment, segmentIndex) in message.segments" :key="segmentIndex">
        <TextSegment
          v-if="segment.type === 'text'"
          :content="segment.content"
        />
        <FileContentSegment
          v-else-if="segment.type === 'file'"
          :fileSegment="segment"
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
        <ThinkSegment
          v-else-if="segment.type === 'think'"
          :content="segment.content"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AIMessage } from '~/types/conversation';
import TextSegment from '~/components/conversation/segments/TextSegment.vue';
import FileContentSegment from '~/components/conversation/segments/FileContentSegment.vue';
import BashCommandSegment from '~/components/conversation/segments/BashCommandSegment.vue';
import ThinkSegment from '~/components/conversation/segments/ThinkSegment.vue';

const props = defineProps<{  message: AIMessage;
  conversationId: string;
  messageIndex: number;
}>();
</script>

<style scoped>
pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
