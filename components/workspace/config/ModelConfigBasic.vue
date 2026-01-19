<template>
  <div class="flex items-center justify-between gap-4">
    <div>
      <label :class="labelClass">{{ label }}</label>
      <p v-if="description" :class="descriptionClass">{{ description }}</p>
    </div>
    <input
      type="checkbox"
      :checked="enabled"
      :disabled="disabled"
      :class="checkboxClass"
      @change="emitEnabled(($event.target as HTMLInputElement).checked)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  enabled: boolean;
  disabled?: boolean;
  label?: string;
  description?: string;
  compact?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:enabled', value: boolean): void;
}>();

const labelClass = computed(() =>
  props.compact
    ? 'block text-xs font-medium text-gray-700'
    : 'block text-sm font-medium text-gray-700'
);

const descriptionClass = computed(() =>
  props.compact
    ? 'text-[10px] text-gray-500'
    : 'text-xs text-gray-500'
);

const checkboxClass = computed(() =>
  props.compact
    ? 'h-3 w-3 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
    : 'h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
);

const emitEnabled = (value: boolean) => {
  emit('update:enabled', value);
};
</script>
