<template>
  <div>
    <strong>Agent:</strong>
    <div>
      <template v-for="(segment, segmentIndex) in message.segments" :key="segmentIndex">
        <TextSegment
          v-if="segment.type === 'text'"
          :content="segment.content"
        />
        <FileContentSegment
          v-else-if="segment.type === 'file'"
          :fileSegment="segment"
          :conversation-id="agentId"
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
            :conversation-id="agentId"
          />
          <ToolCallSegment
            v-else
            :segment="segment"
            :conversation-id="agentId"
          />
        </template>
        <SystemTaskNotificationSegment
          v-else-if="segment.type === 'system_task_notification'"
          :segment="segment"
        />
        <MediaSegment
          v-else-if="segment.type === 'media'"
          :segment="segment"
        />
        <ErrorSegment
          v-else-if="segment.type === 'error'"
          :segment="segment"
        />
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
import SystemTaskNotificationSegment from '~/components/conversation/segments/SystemTaskNotificationSegment.vue';
import MediaSegment from '~/components/conversation/segments/MediaSegment.vue';
import ErrorSegment from '~/components/conversation/segments/ErrorSegment.vue';

const props = defineProps<{
  message: AIMessage;
  agentId: string;
  messageIndex: number;
}>();
</script>

<style scoped>
pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
