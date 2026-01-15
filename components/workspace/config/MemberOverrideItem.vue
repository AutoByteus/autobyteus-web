<template>
  <div class="border border-gray-200 rounded-md p-3 bg-white">
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-gray-700">{{ memberName }}</span>
        <span v-if="isCoordinator" class="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
          Coordinator
        </span>
      </div>
      <span v-if="hasOverride" class="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
        Overridden
      </span>
    </div>

    <!-- LLM Model Override -->
    <div class="mb-3">
      <label class="block text-xs text-gray-500 mb-1">LLM Model Override</label>
      <SearchableGroupedSelect
        :model-value="override?.llmModelIdentifier || ''"
        @update:modelValue="handleModelChange"
        :options="options"
        :disabled="disabled"
        placeholder="Use global model (default)"
        search-placeholder="Search models..."
        class="w-full"
      />
    </div>

    <!-- Auto-execute Override -->
    <div class="flex items-center">
      <input
        :id="`override-auto-${memberName}`"
        type="checkbox"
        :checked="override?.autoExecuteTools === true"
        :indeterminate="override?.autoExecuteTools === undefined"
        @change="handleAutoExecuteChange"
        :disabled="disabled"
        class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
      />
      <label :for="`override-auto-${memberName}`" class="ml-2 text-xs text-gray-600 select-none">
        {{ autoExecuteLabel }}
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { MemberConfigOverride } from '~/types/agent/TeamRunConfig';
import SearchableGroupedSelect, { type GroupedOption } from '~/components/agentTeams/SearchableGroupedSelect.vue';

const props = defineProps<{
  memberName: string;
  agentDefinitionId: string;
  override: MemberConfigOverride | undefined;
  // globalLlmModel: string; // No longer needed for display in SearchableGroupedSelect if we rely on placeholder logic
  options: GroupedOption[];
  isCoordinator?: boolean;
  disabled: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:override', memberName: string, override: MemberConfigOverride | null): void;
}>();

const hasOverride = computed(() => {
  if (!props.override) return false;
  return props.override.llmModelIdentifier || props.override.autoExecuteTools !== undefined;
});

const autoExecuteLabel = computed(() => {
  if (props.override?.autoExecuteTools === undefined) {
    return 'Auto-execute: Use global';
  }
  return props.override.autoExecuteTools ? 'Auto-execute: ON' : 'Auto-execute: OFF';
});

const handleModelChange = (value: string) => {
  const newOverride: MemberConfigOverride = {
    agentDefinitionId: props.agentDefinitionId,
    llmModelIdentifier: value || undefined,
    autoExecuteTools: props.override?.autoExecuteTools,
  };
  
  // If no overrides set, remove entirely
  if (!newOverride.llmModelIdentifier && newOverride.autoExecuteTools === undefined) {
    emit('update:override', props.memberName, null);
  } else {
    emit('update:override', props.memberName, newOverride);
  }
};

const handleAutoExecuteChange = (event: Event) => {
  // const checkbox = event.target as HTMLInputElement; // Not strictly needed for logic below
  
  // Cycle: indeterminate (global) → checked (ON) → unchecked (OFF) → indeterminate
  let newValue: boolean | undefined;
  if (props.override?.autoExecuteTools === undefined) {
    newValue = true; // From global → ON
  } else if (props.override.autoExecuteTools === true) {
    newValue = false; // From ON → OFF
  } else {
    newValue = undefined; // From OFF → global
  }

  const newOverride: MemberConfigOverride = {
    agentDefinitionId: props.agentDefinitionId,
    llmModelIdentifier: props.override?.llmModelIdentifier,
    autoExecuteTools: newValue,
  };
  
  if (!newOverride.llmModelIdentifier && newOverride.autoExecuteTools === undefined) {
    emit('update:override', props.memberName, null);
  } else {
    emit('update:override', props.memberName, newOverride);
  }
};
</script>
