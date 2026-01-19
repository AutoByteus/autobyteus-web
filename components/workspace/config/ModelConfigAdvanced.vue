<template>
  <div class="space-y-2">
    <label :class="sectionLabelClass">Model Parameters</label>
    <p :class="sectionDescriptionClass">Advanced settings override the Thinking toggle.</p>

    <div v-for="(paramSchema, key) in schema" :key="key">
      <label :for="inputId(key)" :class="labelClass">
        {{ key }}
        <span v-if="paramSchema.description" :title="paramSchema.description" class="cursor-help text-gray-400 hover:text-gray-600">ⓘ</span>
      </label>

      <select
        v-if="paramSchema.enum"
        :id="inputId(key)"
        :value="selectValue(key, paramSchema.enum)"
        :disabled="disabled"
        :class="selectClass"
        @change="handleSelectChange(key, ($event.target as HTMLSelectElement).value)"
      >
        <option v-if="paramSchema.default === undefined" :value="DEFAULT_OPTION">Default</option>
        <option v-for="option in paramSchema.enum" :key="String(option)" :value="option">
          {{ option }}
        </option>
      </select>

      <div v-else-if="paramSchema.type === 'boolean'" class="flex items-center">
        <input
          :id="inputId(key)"
          type="checkbox"
          :checked="configValue(key) === true"
          :disabled="disabled"
          :class="checkboxClass"
          @change="handleBooleanChange(key, ($event.target as HTMLInputElement).checked)"
        />
      </div>

      <input
        v-else-if="paramSchema.type === 'integer' || paramSchema.type === 'number'"
        :id="inputId(key)"
        type="number"
        :value="configValue(key) as number | ''"
        :disabled="disabled"
        :class="inputClass"
        @input="handleNumberChange(key, ($event.target as HTMLInputElement).value)"
      />

      <input
        v-else
        :id="inputId(key)"
        type="text"
        :value="configValue(key) as string | ''"
        :disabled="disabled"
        :class="inputClass"
        @input="handleTextChange(key, ($event.target as HTMLInputElement).value)"
      />

      <p v-if="paramSchema.description" :class="descriptionClass">{{ paramSchema.description }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { UiModelConfigSchema } from '~/utils/llmConfigSchema';

const DEFAULT_OPTION = '__default__';

const props = defineProps<{
  schema: UiModelConfigSchema;
  config: Record<string, unknown> | null | undefined;
  disabled?: boolean;
  compact?: boolean;
  idPrefix?: string;
}>();

const emit = defineEmits<{
  (e: 'update:config', value: Record<string, unknown> | null): void;
}>();

const normalizedConfig = computed(() => props.config ?? {});

const sectionLabelClass = computed(() =>
  props.compact
    ? 'block text-xs font-medium text-gray-700'
    : 'block text-sm font-medium text-gray-700'
);

const sectionDescriptionClass = computed(() =>
  props.compact
    ? 'text-[10px] text-gray-500'
    : 'text-xs text-gray-500'
);

const labelClass = computed(() =>
  props.compact
    ? 'block text-[10px] font-medium text-gray-500 mb-1'
    : 'block text-xs font-medium text-gray-500 mb-1'
);

const descriptionClass = computed(() =>
  props.compact
    ? 'text-[10px] text-gray-500 mt-1'
    : 'text-xs text-gray-500 mt-1'
);

const selectClass = computed(() =>
  props.compact
    ? 'block w-full rounded border-gray-300 py-1 pl-2 pr-8 text-xs focus:border-indigo-500 focus:outline-none focus:ring-indigo-500'
    : 'block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm'
);

const inputClass = computed(() =>
  props.compact
    ? 'block w-full rounded border-gray-300 py-1 px-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-indigo-500'
    : 'block w-full rounded-md border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500'
);

const checkboxClass = computed(() =>
  props.compact
    ? 'h-3 w-3 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
    : 'h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
);

const inputId = (key: string) => {
  if (props.idPrefix) {
    return `${props.idPrefix}-${key}`;
  }
  return `config-${key}`;
};

const configValue = (key: string) => normalizedConfig.value[key];

const selectValue = (key: string, options: unknown[]) => {
  const value = normalizedConfig.value[key];
  if (value === undefined && !options.includes(DEFAULT_OPTION)) {
    return DEFAULT_OPTION;
  }
  return value as unknown;
};

const emitConfig = (nextConfig: Record<string, unknown>) => {
  emit('update:config', Object.keys(nextConfig).length > 0 ? nextConfig : null);
};

const updateKey = (key: string, value: unknown, removeIfUndefined = false) => {
  const nextConfig = { ...normalizedConfig.value } as Record<string, unknown>;
  if (removeIfUndefined && value === undefined) {
    delete nextConfig[key];
  } else {
    nextConfig[key] = value;
  }
  emitConfig(nextConfig);
};

const handleSelectChange = (key: string, rawValue: string) => {
  if (rawValue === DEFAULT_OPTION) {
    updateKey(key, undefined, true);
    return;
  }
  updateKey(key, rawValue);
};

const handleBooleanChange = (key: string, checked: boolean) => {
  updateKey(key, checked);
};

const handleNumberChange = (key: string, rawValue: string) => {
  if (rawValue === '') {
    updateKey(key, undefined, true);
    return;
  }
  const parsed = Number(rawValue);
  if (Number.isNaN(parsed)) {
    updateKey(key, undefined, true);
    return;
  }
  updateKey(key, parsed);
};

const handleTextChange = (key: string, value: string) => {
  updateKey(key, value);
};
</script>
