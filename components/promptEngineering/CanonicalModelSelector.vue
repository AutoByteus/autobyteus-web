<template>
  <div>
    <label class="block text-sm font-medium text-gray-700">Suitable for Models</label>
    <div class="relative mt-1">
      <button
        type="button"
        @click="isModelDropdownOpen = !isModelDropdownOpen"
        class="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
      >
        <span class="block truncate">
          {{ selectedModels.length > 0 ? selectedModels.join(', ') : 'Select models...' }}
        </span>
        <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M10 3a.75.75 0 01.53.22l3.5 3.5a.75.75 0 01-1.06 1.06L10 4.81 7.03 7.78a.75.75 0 01-1.06-1.06l3.5-3.5A.75.75 0 0110 3zM10 17a.75.75 0 01-.53-.22l-3.5-3.5a.75.75 0 011.06-1.06L10 15.19l2.97-2.97a.75.75 0 011.06 1.06l-l3.5 3.5A.75.75 0 0110 17z" clip-rule="evenodd" />
          </svg>
        </span>
      </button>
      <transition leave-active-class="transition ease-in duration-100" leave-from-class="opacity-100" leave-to-class="opacity-0">
        <div v-if="isModelDropdownOpen" class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
          <ul v-if="canonicalModels.length > 0">
            <li v-for="model in canonicalModels" :key="model" class="relative cursor-default select-none py-2 pl-3 pr-9 text-gray-900 hover:bg-blue-50">
              <label class="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  :value="model"
                  :checked="selectedModels.includes(model)"
                  @change="toggleModelSelection(model)"
                  class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span class="ml-3 block truncate">{{ model }}</span>
              </label>
            </li>
          </ul>
           <div v-else class="px-3 py-2 text-gray-500">
            Loading models...
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useLLMProviderConfigStore } from '~/stores/llmProviderConfig';
import { storeToRefs } from 'pinia';

const props = defineProps<{  modelValue: string[];
}>();

const emit = defineEmits(['update:modelValue']);

const llmStore = useLLMProviderConfigStore();
const { canonicalModels } = storeToRefs(llmStore);
const isModelDropdownOpen = ref(false);

const selectedModels = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

function toggleModelSelection(model: string) {
  const newSelection = [...selectedModels.value];
  const index = newSelection.indexOf(model);
  if (index > -1) {
    newSelection.splice(index, 1);
  } else {
    newSelection.push(model);
  }
  selectedModels.value = newSelection;
}

onMounted(() => {
  if (llmStore.canonicalModels.length === 0) {
    llmStore.fetchProvidersWithModels();
  }
});
</script>
