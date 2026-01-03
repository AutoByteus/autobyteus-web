<template>
  <div class="relative group pr-8">
    <!-- Copy Button: Visible on hover -->
    <div class="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
      <CopyButton :text-to-copy="message.text" label="Copy message" />
    </div>

    <strong>Agent:</strong>
    <div>
      <template v-for="(segment, segmentIndex) in message.segments" :key="segmentIndex">
        <TextSegment
          v-if="segment.type === 'text'"
          :content="segment.content"
        />
        <FileContentSegment
          v-else-if="segment.type === 'write_file'"
          :fileSegment="segment"
          :conversation-id="agentId"
          :message-index="messageIndex"
        />
        <TerminalCommandSegment
          v-else-if="segment.type === 'terminal_command'"
          :command="segment.command"
          :description="segment.description"
          :conversation-id="agentId"
          :message-index="messageIndex"
          :segment-index="segmentIndex"
        />
        <ThinkSegment
          v-else-if="segment.type === 'think'"
          :content="segment.content"
        />
        <template v-else-if="segment.type === 'tool_call'">
          <WriteFileCommandSegment
            v-if="isWriteFileTool(segment.toolName)"
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
        <InterAgentMessageSegment
          v-else-if="segment.type === 'inter_agent_message'"
          :segment="segment"
        />
        <MediaSegment
          v-else-if="segment.type === 'media'"
          :segment="segment"
        />
        <IframeSegment
          v-else-if="segment.type === 'iframe'"
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
import TerminalCommandSegment from '~/components/conversation/segments/TerminalCommandSegment.vue';
import ThinkSegment from '~/components/conversation/segments/ThinkSegment.vue';
import ToolCallSegment from '~/components/conversation/segments/ToolCallSegment.vue';
import WriteFileCommandSegment from '~/components/conversation/segments/WriteFileCommandSegment.vue';
import SystemTaskNotificationSegment from '~/components/conversation/segments/SystemTaskNotificationSegment.vue';
import InterAgentMessageSegment from '~/components/conversation/segments/InterAgentMessageSegment.vue';
import MediaSegment from '~/components/conversation/segments/MediaSegment.vue';
import IframeSegment from '~/components/conversation/segments/IframeSegment.vue';
import ErrorSegment from '~/components/conversation/segments/ErrorSegment.vue';
import CopyButton from '~/components/common/CopyButton.vue';

const props = defineProps<{
  message: AIMessage;
  agentId: string;
  messageIndex: number;
}>();

const isWriteFileTool = (toolName: string) => toolName === 'write_file';
</script>

<style scoped>
pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
