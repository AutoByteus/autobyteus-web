<template>
  <div class="border border-gray-300 shadow-sm bg-white">
    <ContextFilePathInputArea />
    <div class="border-t border-gray-200">
      <AgentUserInputTextArea />
    </div>
  </div>
</template>

<script setup lang="ts">
import ContextFilePathInputArea from '~/components/agentInput/ContextFilePathInputArea.vue';
import AgentUserInputTextArea from '~/components/agentInput/AgentUserInputTextArea.vue';
</script>
