<template>
  <div v-if="hasSchema" :class="sectionClass">
    <div :class="panelClass">
      <ModelConfigBasic
        v-if="thinkingSupported"
        v-model:enabled="thinkingEnabled"
        :disabled="disabled"
        :label="thinkingLabel"
        :description="thinkingDescription"
        :compact="compact"
      />

      <button
        type="button"
        data-testid="advanced-params-toggle"
        @click="showAdvancedParams = !showAdvancedParams"
        :disabled="disabled"
        :class="toggleClass"
        :aria-expanded="showAdvancedParams"
      >
        <span class="flex items-center gap-2">
          <span class="transition-transform duration-200" :class="showAdvancedParams ? 'rotate-90' : ''">
            <span :class="chevronClass"></span>
          </span>
          <span class="text-left">
            <span :class="toggleTitleClass">Advanced parameters</span>
            <span :class="toggleDescriptionClass">Overrides the Thinking toggle.</span>
          </span>
        </span>
        <span :class="toggleHintClass">
          {{ showAdvancedParams ? 'Hide' : 'Show' }}
        </span>
      </button>

      <div v-show="showAdvancedParams" :class="advancedWrapperClass">
        <ModelConfigAdvanced
          :schema="schema"
          :config="modelConfig"
          :disabled="disabled"
          :compact="compact"
          :id-prefix="idPrefix"
          @update:config="emitConfig"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { UiModelConfigSchema } from '~/utils/llmConfigSchema';
import { applyThinkingToggle, getThinkingParamKeys, getThinkingToggleState, hasThinkingSupport } from '~/utils/llmThinkingConfigAdapter';
import ModelConfigBasic from './ModelConfigBasic.vue';
import ModelConfigAdvanced from './ModelConfigAdvanced.vue';

const props = defineProps<{
  schema: UiModelConfigSchema | null;
  modelConfig: Record<string, unknown> | null | undefined;
  disabled?: boolean;
  applyDefaults?: boolean;
  clearOnEmptySchema?: boolean;
  compact?: boolean;
  idPrefix?: string;
  thinkingLabel?: string;
  thinkingDescription?: string;
}>();

const emit = defineEmits<{
  (e: 'update:config', value: Record<string, unknown> | null): void;
}>();

const showAdvancedParams = ref(false);

const hasSchema = computed(() => !!props.schema && Object.keys(props.schema).length > 0);

const thinkingSupported = computed(() => hasThinkingSupport(props.schema ?? null));

const thinkingLabel = computed(() => props.thinkingLabel ?? 'Thinking');
const thinkingDescription = computed(() => props.thinkingDescription ?? 'Auto include summaries when supported.');

const sectionClass = computed(() =>
  props.compact ? 'mt-3 pt-3 border-t border-gray-100 space-y-2' : 'space-y-3 border-t border-gray-200 pt-3'
);

const panelClass = computed(() =>
  props.compact
    ? 'rounded-md border border-gray-100 bg-gray-50/70 p-2 space-y-2'
    : 'rounded-lg border border-gray-200 bg-gray-50/70 p-3 space-y-3'
);

const toggleClass = computed(() =>
  props.compact
    ? 'flex w-full items-center justify-between rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors'
    : 'flex w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors'
);

const chevronClass = computed(() =>
  props.compact
    ? 'i-heroicons-chevron-right-20-solid w-3 h-3'
    : 'i-heroicons-chevron-right-20-solid w-4 h-4'
);

const toggleTitleClass = computed(() =>
  props.compact ? 'block text-[11px] font-semibold text-gray-700' : 'block text-sm font-semibold text-gray-700'
);

const toggleDescriptionClass = computed(() =>
  props.compact ? 'block text-[10px] text-gray-500' : 'block text-xs text-gray-500'
);

const toggleHintClass = computed(() =>
  props.compact ? 'text-[10px] text-gray-400' : 'text-xs text-gray-400'
);

const advancedWrapperClass = computed(() =>
  props.compact
    ? 'mt-2 rounded-md border border-gray-200 bg-white/80 p-2'
    : 'mt-2 rounded-md border border-gray-200 bg-white/80 p-3'
);

const emitConfig = (nextConfig: Record<string, unknown> | null) => {
  emit('update:config', nextConfig ?? null);
};

const thinkingEnabled = computed({
  get() {
    return getThinkingToggleState(props.schema ?? null, props.modelConfig ?? null);
  },
  set(value: boolean) {
    const updatedConfig = applyThinkingToggle(
      props.schema ?? null,
      value,
      props.modelConfig ?? null,
    );
    emitConfig(updatedConfig ?? null);
  },
});

const configsEqual = (
  left: Record<string, unknown> | null | undefined,
  right: Record<string, unknown> | null | undefined,
) => JSON.stringify(left ?? null) === JSON.stringify(right ?? null);

const applyDefaultsIfNeeded = () => {
  if (!hasSchema.value) return;
  if (!props.applyDefaults) return;

  const nextConfig: Record<string, unknown> = { ...(props.modelConfig ?? {}) };
  let changed = false;
  const thinkingKeys = new Set(getThinkingParamKeys(props.schema ?? null));

  for (const [key, paramSchema] of Object.entries(props.schema ?? {})) {
    if (thinkingKeys.has(key)) continue;
    if (nextConfig[key] === undefined && paramSchema.default !== undefined) {
      nextConfig[key] = paramSchema.default;
      changed = true;
    }
  }

  if (changed && !configsEqual(nextConfig, props.modelConfig ?? null)) {
    emitConfig(nextConfig);
  }
};

const clearConfigIfEmptySchema = () => {
  if (hasSchema.value) return;
  if (!props.clearOnEmptySchema) return;
  if (props.modelConfig == null) return;
  emitConfig(null);
};

watch(
  () => [props.schema, props.modelConfig, props.applyDefaults],
  () => {
    applyDefaultsIfNeeded();
    clearConfigIfEmptySchema();
  },
  { immediate: true },
);

watch(
  () => props.schema,
  () => {
    showAdvancedParams.value = false;
  },
);
</script>
