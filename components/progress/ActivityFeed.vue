<template>
  <div class="h-full flex flex-col bg-white overflow-hidden">
    <!-- Header -->
    <div class="px-3 py-2 bg-gray-50 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
      <h3 class="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none">Activity Log</h3>
      <span class="text-[10px] text-gray-400 font-mono">{{ activities.length }} Events</span>
    </div>

    <!-- Feed -->
    <div ref="feedContainer" class="flex-1 overflow-y-auto custom-scrollbar">
      <div v-if="activities.length === 0" class="p-8 text-center text-gray-500 text-sm">
        No activity history yet.
      </div>
      
      <div v-else>
        <ActivityItem 
          v-for="activity in activities" 
          :key="activity.invocationId" 
          :activity="activity"
          :ref="(el) => setItemRef(activity.invocationId, el)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue';
import { useAgentActivityStore } from '~/stores/agentActivityStore';
import { useActiveContextStore } from '~/stores/activeContextStore';
import ActivityItem from './ActivityItem.vue';

const activityStore = useAgentActivityStore();
const activeContext = useActiveContextStore();

const currentAgentId = computed(() => activeContext.activeAgentContext?.state.agentId ?? '');

const activities = computed(() => {
  if (!currentAgentId.value) return [];
  // Return reversed copy if we want newest up top? Or standard log order?
  // Standard log order (append bottom) is usually better for "Feed".
  return activityStore.getActivities(currentAgentId.value);
});

// Highlighting / Scrolling
const feedContainer = ref<HTMLElement | null>(null);
const itemRefs = ref<Record<string, any>>({});

const setItemRef = (id: string, el: any) => {
  if (el) itemRefs.value[id] = el;
};

// Scroll to bottom on new activity
watch(() => activities.value.length, () => {
  nextTick(() => {
    if (feedContainer.value) {
      feedContainer.value.scrollTop = feedContainer.value.scrollHeight;
    }
  });
});

// Scroll to highlighted
const highlightedId = computed(() => 
  currentAgentId.value ? activityStore.getHighlightedActivityId(currentAgentId.value) : null
);

watch(highlightedId, (newId) => {
  if (newId && itemRefs.value[newId]) {
    // Determine strict Vue component or DOM element
    const el = itemRefs.value[newId].$el || itemRefs.value[newId]; 
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Identify visual highlight logic here if needed (e.g. flash CSS class)
    }
  }
});
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
