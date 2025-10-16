<template>
  <div class="h-full bg-white p-4 flex flex-col">
    <!-- Progress Bar -->
    <div v-if="totalTodos > 0" class="flex-shrink-0">
      <div class="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
        <div
          class="h-full rounded-full bg-blue-600 transition-all duration-300"
          :style="{ width: progressWidth }"
        ></div>
      </div>
      <p class="mt-2 text-xs text-gray-500">
        {{ progressLabel }}
      </p>
    </div>

    <!-- To-Do List -->
    <ul
      v-if="decoratedTodos.length"
      class="mt-4 border-t border-gray-200 flex-1 overflow-y-auto -mx-4"
    >
      <li
        v-for="todo in decoratedTodos"
        :key="todo.todoId"
        class="px-4 py-3 flex items-center justify-between gap-4 border-b border-gray-100 last:border-b-0"
      >
        <div class="flex items-center gap-3 min-w-0">
          <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" :class="todo.meta.dotClass"></span>
          <p 
            class="text-sm text-gray-800 truncate" 
            :class="{ 'text-gray-500': todo.status === ToDoStatus.DONE }" 
            :title="todo.description"
          >
            {{ todo.description }}
          </p>
        </div>
        <span class="text-xs font-medium flex-shrink-0" :class="todo.meta.textClass">
          {{ todo.meta.label }}
        </span>
      </li>
    </ul>

    <!-- Empty State -->
    <div
      v-else
      class="flex-1 flex items-center justify-center text-center bg-gray-50 rounded-lg"
    >
      <div class="px-4 py-8">
        <span class="i-heroicons-clipboard-document-check-20-solid w-10 h-10 text-gray-300 mx-auto"></span>
        <p class="mt-3 text-sm font-semibold text-gray-700">No to-dos yet</p>
        <p class="mt-1 text-xs text-gray-500 max-w-[240px]">
          Ask the agent to break down the work. The plan will appear here automatically.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ToDoStatus, type ToDo } from '~/types/todo';

type StatusMeta = {
  label: string;
  dotClass: string;
  textClass: string;
};

type DecoratedToDo = ToDo & { meta: StatusMeta };

const props = defineProps<{ todos: ToDo[] }>();

const baseStatusMeta: Record<ToDoStatus, StatusMeta> = {
  [ToDoStatus.PENDING]: {
    label: 'Pending',
    dotClass: 'bg-yellow-400',
    textClass: 'text-yellow-800',
  },
  [ToDoStatus.IN_PROGRESS]: {
    label: 'In Progress',
    dotClass: 'bg-blue-500 animate-pulse',
    textClass: 'text-blue-800 font-semibold',
  },
  [ToDoStatus.DONE]: {
    label: 'Done',
    dotClass: 'bg-green-500',
    textClass: 'text-green-800',
  }
};

const toDoArray = computed(() => props.todos ?? []);

const decoratedTodos = computed<DecoratedToDo[]>(() => {
  return toDoArray.value.map(todo => {
    return {
      ...todo,
      meta: baseStatusMeta[todo.status] ?? baseStatusMeta[ToDoStatus.PENDING]
    };
  });
});

const completedCount = computed(() => decoratedTodos.value.filter(todo => todo.status === ToDoStatus.DONE).length);
const totalTodos = computed(() => decoratedTodos.value.length);

const progressPercent = computed(() => {
  if (totalTodos.value === 0) return 0;
  return Math.round((completedCount.value / totalTodos.value) * 100);
});

const progressWidth = computed(() => `${progressPercent.value}%`);

const progressLabel = computed(() => {
  return `${completedCount.value} of ${totalTodos.value} tasks done (${progressPercent.value}%)`;
});
</script>
