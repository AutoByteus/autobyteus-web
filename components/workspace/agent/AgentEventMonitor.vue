<template>
  <!-- This root div is a flex column aiming to fill its parent's height (from AgentEventMonitorTabs) -->
  <div class="flex flex-col h-full p-4"> <!-- Added p-4 for overall padding inside the monitor area -->
    
    <!-- Messages and Totals -->
    <!-- This div will take its natural height. No flex-grow here, allow it to be short. -->
    <div>
      <div class="space-y-4 mb-4">
        <div
          v-for="(message, index) in conversation.messages"
          :key="message.timestamp + '-' + message.type + '-' + index"
          :class="[
            'p-3 rounded-lg max-w-full relative shadow-sm hover:shadow-md transition-shadow duration-200 break-words',
            message.type === 'user' ? 'ml-auto bg-blue-100 text-blue-800' : 'mr-auto bg-gray-100 text-gray-800'
          ]"
        >
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

          <span class="text-xs text-blue-700 font-medium absolute bottom-1 right-2">
            {{ formatTokenCost(message) }}
          </span>
        </div>
      </div>
      <!-- Display total tokens and total cost at the bottom of the conversation -->
      <div
        v-if="totalUsage.totalTokens > 0"
        class="text-xs text-blue-700 font-medium mt-2 text-right mb-4"
      >
        Total: {{ totalUsage.totalTokens }} tokens / ${{ totalUsage.totalCost.toFixed(4) }}
      </div>
    </div>

    <!-- AgentUserInputForm wrapper -->
    <div class="mt-auto pt-4"> 
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
/* Ensure messages wrap properly on small screens */
/* h-full and flex flex-col on the root div are crucial for the sticky footer effect */
</style>
