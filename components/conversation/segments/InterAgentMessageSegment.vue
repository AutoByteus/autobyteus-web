<template>
  <div class="inter-agent-message my-4 border rounded-lg bg-blue-50 border-blue-200 dark:bg-slate-800 dark:border-blue-800 overflow-hidden">
    <!-- Header Section -->
    <div class="flex items-center space-x-3 p-4">
      <div class="flex-shrink-0 text-2xl">🤝</div>
      <div class="flex-1 min-w-0">
        <p class="font-semibold text-blue-800 dark:text-blue-300 truncate">
          From {{ segment.senderAgentId }}
        </p>
        <p class="text-xs text-blue-700 dark:text-blue-200 truncate">
          Type: {{ segment.messageType }} · Intended role: {{ segment.recipientRoleName }}
        </p>
      </div>
    </div>

    <!-- Content Section -->
    <div class="px-4 pb-4">
      <pre class="text-sm text-blue-800 dark:text-blue-100 whitespace-pre-wrap font-mono m-0 bg-blue-100 dark:bg-slate-700 p-3 rounded-md"><code>{{ segment.content }}</code></pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { InterAgentMessageSegment } from '~/types/segments';

defineProps<{ segment: InterAgentMessageSegment }>();
</script>
