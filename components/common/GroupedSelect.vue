<template>
  <div class="relative w-full" ref="wrapperRef">
    <!-- Display Button -->
    <button
      @click="toggleDropdown"
      :disabled="disabled || loading"
      type="button"
      class="w-full px-3 py-2 text-sm text-left border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200 flex items-center justify-between"
      :class="{ 'cursor-not-allowed opacity-50': disabled || loading }"
    >
      <span v-if="loading" class="text-gray-500">Loading...</span>
      <span v-else-if="modelValue" class="truncate">{{ modelValue }}</span>
      <span v-else class="text-gray-500">{{ placeholder }}</span>
      
      <svg class="w-4 h-4 ml-2 text-gray-500 flex-shrink-0 transform transition-transform" 
           :class="{ 'rotate-180': isOpen }"
           fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
      </svg>
    </button>

    <!-- Dropdown Popover -->
    <div
      v-if="isOpen"
      ref="popoverRef"
      class="absolute z-20 bottom-full right-0 mb-1 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-[30rem] overflow-y-auto flex flex-col"
    >
      <!-- Search Input -->
      <div class="p-2 sticky top-0 bg-white dark:bg-gray-800/95 z-10 backdrop-blur-sm">
        <input
          ref="searchInputRef"
          v-model="searchTerm"
          type="text"
          placeholder="Search models..."
          class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <!-- Options List -->
      <div class="flex-grow overflow-y-auto">
        <div v-if="filteredOptions.length === 0" class="p-3 text-sm text-center text-gray-500">
          No models found.
        </div>
        <div v-for="group in filteredOptions" :key="group.label" class="py-1">
          <div class="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {{ group.label }}
          </div>
          <ul>
            <li
              v-for="item in group.items"
              :key="item"
              @click="selectItem(item)"
              class="pl-6 pr-3 py-2 text-sm text-gray-800 dark:text-gray-200 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/50 flex items-center justify-between"
              :class="{ 'bg-blue-100 dark:bg-blue-800': modelValue === item }"
            >
              <span class="truncate">{{ item }}</span>
              <svg v-if="modelValue === item" class="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
              </svg>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';

export interface GroupedOption {
  label: string;
  items: string[];
}

const props = withDefaults(defineProps<{  modelValue: string | null;
  options: GroupedOption[];
  placeholder?: string;
  loading?: boolean;
  disabled?: boolean;
}>(), {
  placeholder: 'Select an option',
  loading: false,
  disabled: false,
});

const emit = defineEmits(['update:modelValue']);

const isOpen = ref(false);
const searchTerm = ref('');
const wrapperRef = ref<HTMLDivElement | null>(null);
const searchInputRef = ref<HTMLInputElement | null>(null);

const filteredOptions = computed(() => {
  if (!searchTerm.value) {
    return props.options;
  }
  const searchLower = searchTerm.value.toLowerCase();
  return props.options
    .map(group => ({
      ...group,
      items: group.items.filter(item => item.toLowerCase().includes(searchLower))
    }))
    .filter(group => group.items.length > 0);
});

const toggleDropdown = () => {
  if (props.disabled || props.loading) return;
  isOpen.value = !isOpen.value;
};

const selectItem = (item: string) => {
  emit('update:modelValue', item);
  isOpen.value = false;
  searchTerm.value = '';
};

const handleClickOutside = (event: MouseEvent) => {
  if (wrapperRef.value && !wrapperRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
};

watch(isOpen, (newValue) => {
  if (newValue) {
    nextTick(() => {
      searchInputRef.value?.focus();
    });
  }
});

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside);
});
</script>
