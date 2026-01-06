<template>
  <div class="h-full flex flex-col bg-white">
    <!-- Top Section: To-Do List (Goals) -->
    <!-- We keep it collapsible or fixed height? 
         For now, simpler is fixed structure: Todo Panel auto-sizes or has max height.
         TodoListPanel usually takes full height. We need to wrap it.
    -->
    <div class="flex-shrink-0 border-b border-gray-700 bg-white" style="max-height: 40%">
      <!-- Wrapper to constrain height if needed, or let it grow until a limit -->
      <TodoListPanel :todos="todos" class="h-full overflow-y-auto custom-scrollbar" />
    </div>

    <!-- Bottom Section: Activity Feed (Actions) -->
    <div class="flex-1 min-h-0">
      <ActivityFeed />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ToDo } from '~/types/todo';
import TodoListPanel from '~/components/workspace/agent/TodoListPanel.vue';
import ActivityFeed from '~/components/progress/ActivityFeed.vue';

defineProps<{
  todos: ToDo[];
}>();
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}
</style>
