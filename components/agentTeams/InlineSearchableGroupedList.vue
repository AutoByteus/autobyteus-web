<template>
  <div>
    <button
      type="button"
      @click="isOpen = !isOpen"
      class="w-full flex items-center justify-between text-left text-sm p-2 rounded-md transition-colors"
      :class="buttonClass"
    >
      <span class="truncate">{{ displayLabel }}</span>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" :class="['w-4 h-4 transition-transform flex-shrink-0 ml-2', { 'rotate-180': isOpen }]">
        <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
      </svg>
    </button>
    <div v-if="isOpen" class="mt-2 border rounded-md p-2 bg-gray-50 max-h-80 overflow-y-auto">
      <input
        type="text"
        v-model="searchTerm"
        :placeholder="searchPlaceholder"
        class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sticky top-0 z-10"
      />
      <div class="mt-2">
        <div v-if="filteredOptions.length === 0" class="p-3 text-sm text-center text-gray-500">No items found.</div>
        <div v-for="group in filteredOptions" :key="group.label" class="py-1">
          <div class="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ group.label }}</div>
          <ul>
            <li
              v-for="item in group.items"
              :key="item.id"
              @click="selectItem(item.id)"
              class="pl-6 pr-3 py-2 text-sm text-gray-800 cursor-pointer hover:bg-blue-100"
            >
              {{ item.name }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { GroupedOption } from '~/types/TeamLaunchProfile';

const props = withDefaults(defineProps<{  modelValue: string | null | undefined;
  options: GroupedOption[];
  buttonLabel?: string;
  buttonClass?: string;
  placeholder?: string;
  searchPlaceholder?: string;
}>(), {
  buttonLabel: '',
  buttonClass: 'bg-white border border-gray-300 text-gray-900 hover:border-gray-400',
  placeholder: 'Select an option...',
  searchPlaceholder: 'Search...',
});

const emit = defineEmits(['update:modelValue']);

const isOpen = ref(false);
const searchTerm = ref('');

const displayLabel = computed(() => {
    if (props.buttonLabel) return props.buttonLabel;
    if (props.modelValue) return props.modelValue;
    return props.placeholder;
});

const filteredOptions = computed(() => {
  if (!searchTerm.value) return props.options;
  const searchLower = searchTerm.value.toLowerCase();
  return props.options
    .map(group => ({
      ...group,
      items: group.items.filter(item => item.name.toLowerCase().includes(searchLower))
    }))
    .filter(group => group.items.length > 0);
});

const selectItem = (itemId: string) => {
  emit('update:modelValue', itemId);
  isOpen.value = false;
  searchTerm.value = '';
};
</script>
