<template>
  <div class="inter-agent-message my-4 p-4 border rounded-lg bg-blue-50 border-blue-200 dark:bg-slate-800 dark:border-blue-800">
    <div class="flex items-start space-x-3">
      <div class="flex-shrink-0 text-2xl">🤝</div>
      <div class="flex-1">
        <p class="font-semibold text-blue-800 dark:text-blue-300">
          From {{ segment.senderAgentId }}
        </p>
        <p class="text-xs text-blue-700 dark:text-blue-200 mb-2">
          Type: {{ segment.messageType }} · Intended role: {{ segment.recipientRoleName }}
        </p>
        <pre class="mt-2 text-sm text-blue-800 dark:text-blue-100 whitespace-pre-wrap font-mono bg-blue-100 dark:bg-slate-700 p-3 rounded"><code>{{ segment.content }}</code></pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { InterAgentMessageSegment } from '~/utils/aiResponseParser/types';

defineProps<{ segment: InterAgentMessageSegment }>();
</script>
