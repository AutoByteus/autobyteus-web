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
        <ThinkSegment
          v-else-if="segment.type === 'think'"
          :content="segment.content"
        />
        <template v-else-if="segment.type === 'tool_call'">
          <FileWriterSegment
            v-if="segment.toolName === 'FileWriter'"
            :segment="segment"
            :conversation-id="conversationId"
          />
          <ToolCallSegment
            v-else
            :segment="segment"
            :conversation-id="conversationId"
          />
        </template>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AIMessage } from '~/types/conversation';
import TextSegment from '~/components/conversation/segments/TextSegment.vue';
import FileContentSegment from '~/components/conversation/segments/FileContentSegment.vue';
import ThinkSegment from '~/components/conversation/segments/ThinkSegment.vue';
import ToolCallSegment from '~/components/conversation/segments/ToolCallSegment.vue';
import FileWriterSegment from '~/components/conversation/segments/FileWriterSegment.vue';

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
