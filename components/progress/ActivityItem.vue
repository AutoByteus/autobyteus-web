<template>
  <div class="activity-item border-b border-gray-100 last:border-0">
    <!-- Header Row -->
    <div 
      class="flex items-center gap-3 px-3 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
      @click="toggleExpand"
    >
      <!-- Status Icon -->
      <div class="flex-shrink-0 w-6 flex justify-center">
        <template v-if="activity.status === 'executing' || activity.status === 'parsing'">
          <div class="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
        </template>
        <template v-else-if="activity.status === 'success'">
          <Icon name="heroicons:check-circle" class="w-6 h-6 text-green-600" />
        </template>
        <template v-else-if="activity.status === 'error'">
          <Icon name="heroicons:x-circle" class="w-6 h-6 text-red-600" />
        </template>
        <template v-else-if="activity.status === 'awaiting-approval'">
          <Icon name="heroicons:exclamation-triangle" class="w-6 h-6 text-amber-500 animate-pulse" />
        </template>
        <template v-else-if="activity.status === 'denied'">
          <Icon name="heroicons:no-symbol" class="w-6 h-6 text-gray-400" />
        </template>
        <template v-else>
          <Icon name="heroicons:question-mark-circle" class="w-6 h-6 text-gray-300" />
        </template>
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0 flex flex-col">
        <div class="flex items-center gap-2">
          <span class="font-mono text-base font-bold text-gray-900 truncate">
            {{ activity.toolName }}
          </span>
          <span 
            v-if="activity.status === 'awaiting-approval'"
            class="text-[11px] uppercase tracking-wider font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded"
          >
            Review Required
          </span>
        </div>
        <div class="text-xs text-gray-500 truncate font-mono mt-1" :title="activity.contextText">
          {{ activity.contextText }}
        </div>
      </div>

      <!-- Time or Expand Icon -->
      <div class="text-gray-400 flex items-center">
        <Icon 
          :name="isExpanded ? 'heroicons:chevron-up' : 'heroicons:chevron-down'" 
          class="w-5 h-5 transition-transform duration-200"
        />
      </div>
    </div>

    <!-- Details (Expanded) -->
    <div v-show="isExpanded" class="bg-gray-50 px-3 py-3 pl-12 text-sm font-mono border-t border-gray-100">
      
      <!-- Result Section -->
      <div v-if="activity.result" class="mb-4">
        <div class="text-green-700 font-bold mb-1">Result:</div>
        <pre class="whitespace-pre-wrap text-gray-800 bg-white border border-gray-200 p-3 rounded shadow-sm max-h-60 overflow-y-auto">{{ formatJson(activity.result) }}</pre>
      </div>

      <!-- Error Section -->
      <div v-if="activity.error" class="mb-4">
        <div class="text-red-700 font-bold mb-1">Error:</div>
        <pre class="whitespace-pre-wrap text-red-800 bg-red-50 border border-red-200 p-3 rounded">{{ activity.error }}</pre>
      </div>

      <!-- Arguments Section (if interesting) -->
      <div v-if="hasInterestingArgs" class="mb-4">
        <div class="text-blue-700 font-bold mb-1">Arguments:</div>
        <pre class="whitespace-pre-wrap text-gray-700 bg-white border border-gray-200 p-3 rounded shadow-sm">{{ formatJson(activity.arguments) }}</pre>
      </div>

      <!-- Logs -->
      <div v-if="activity.logs.length > 0">
        <div class="text-gray-600 font-bold mb-1">Logs:</div>
        <div class="space-y-1">
          <div v-for="(log, idx) in activity.logs" :key="idx" class="text-gray-600 border-l-2 border-gray-300 pl-3">
            {{ log }}
          </div>
        </div>
      </div>

      <div v-if="!activity.result && !activity.error && activity.logs.length === 0 && !hasInterestingArgs" class="text-gray-400 italic">
        No details available yet...
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ToolActivity } from '~/stores/agentActivityStore';

const props = defineProps<{
  activity: ToolActivity;
}>();

const isExpanded = ref(false);

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
};

const hasInterestingArgs = computed(() => {
  const args = props.activity.arguments;
  return args && Object.keys(args).length > 0;
});

const formatJson = (val: any) => {
  if (typeof val === 'string') return val;
  try {
    return JSON.stringify(val, null, 2);
  } catch {
    return String(val);
  }
};
</script>

<style scoped>
.activity-item {
  @apply transition-all duration-200;
}
</style>
