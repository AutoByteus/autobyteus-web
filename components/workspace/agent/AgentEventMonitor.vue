<template>
  <div class="flex flex-col h-full p-4 gap-3">
    <div class="flex-1 min-h-0 overflow-y-auto">
      <div class="rounded-xl bg-white">
        <div
          v-for="(message, index) in conversation.messages"
          :key="message.timestamp + '-' + message.type + '-' + index"
          class="px-2 py-3 break-words"
        >
          <div>
            <UserMessage
              v-if="message.type === 'user'"
              :message="message"
              user-display-name="You"
            />
            <AIMessage
              v-else
              :message="message"
              :agent-id="agentId"
              :agent-name="agentName"
              :agent-avatar-url="agentAvatarUrl"
              :message-index="index"
            />
          </div>

          <span
            v-if="formatTokenCost(message)"
            class="block mt-1 text-[11px] text-gray-400 font-medium text-right pr-8"
          >
            {{ formatTokenCost(message) }}
          </span>
        </div>
      </div>

      <div
        v-if="totalUsage.totalTokens > 0"
        class="text-xs text-gray-500 font-medium mt-2 text-right"
      >
        Total: {{ totalUsage.totalTokens }} tokens / ${{ totalUsage.totalCost.toFixed(4) }}
      </div>
    </div>

    <div>
      <AgentUserInputForm />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Conversation, Message } from '~/types/conversation';
import UserMessage from '~/components/conversation/UserMessage.vue';
import AIMessage from '~/components/conversation/AIMessage.vue';
import AgentUserInputForm from '~/components/agentInput/AgentUserInputForm.vue';

const props = defineProps<{
  conversation: Conversation;
  agentName?: string;
  agentAvatarUrl?: string | null;
}>();

const agentId = computed(() => props.conversation.id);

const formatTokenCost = (message: Message) => {
  if (message.type === 'user') {
    const userMsg = message;
    if (userMsg.promptTokens != null && userMsg.promptCost != null) {
      return `${userMsg.promptTokens} tokens / $${userMsg.promptCost.toFixed(4)}`;
    }
    return '';
  } else if (message.type === 'ai') {
    const aiMsg = message;
    if (aiMsg.completionTokens != null && aiMsg.completionCost != null) {
      return `${aiMsg.completionTokens} tokens / $${aiMsg.completionCost.toFixed(4)}`;
    }
    return '';
  }
  return '';
};

/**
 * Computes the total tokens and total cost for the entire conversation.
 */
const totalUsage = computed(() => {
  let totalTokens = 0;
  let totalCost = 0;
  props.conversation.messages.forEach((message) => {
    if (message.type === 'user') {
      if (message.promptTokens) {
        totalTokens += message.promptTokens;
      }
      if (message.promptCost) {
        totalCost += message.promptCost;
      }
    } else if (message.type === 'ai') {
      if (message.completionTokens) {
        totalTokens += message.completionTokens;
      }
      if (message.completionCost) {
        totalCost += message.completionCost;
      }
    }
  });
  return { totalTokens, totalCost };
});
</script>

<style scoped>
</style>
