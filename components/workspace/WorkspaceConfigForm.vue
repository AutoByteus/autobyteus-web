<template>
  <div class="space-y-4">
    <!-- Workspace Type Selection -->
    <div>
      <label class="block text-sm font-medium text-gray-700">Workspace Type</label>
       <div class="mt-2 space-y-2">
         <div
            v-for="type in workspaceStore.availableWorkspaceTypes"
            :key="type.name"
            @click="selectNewWorkspaceType(type.name)"
            :class="[
              'p-3 border rounded-lg cursor-pointer transition-all duration-150',
              localConfig.typeName === type.name
                ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500'
                : 'bg-white border-gray-200 hover:bg-gray-50'
            ]"
          >
            <h4 class="font-semibold text-gray-800">{{ type.name }}</h4>
            <p class="text-sm text-gray-600 mt-1">{{ type.description }}</p>
          </div>
       </div>
    </div>

    <!-- Dynamic Form Fields -->
    <div v-if="selectedSchema" class="space-y-4 pt-4 border-t border-gray-200">
        <div v-for="param in selectedSchema.parameters" :key="param.name">
            <label :for="`param-${param.name}`" class="block text-sm font-medium text-gray-700">
              {{ capitalize(param.name.replace(/_/g, ' ')) }}
              <span v-if="param.required" class="text-red-500">*</span>
            </label>
            <input
              :id="`param-${param.name}`"
              :type="getHtmlInputType(param.param_type)"
              :placeholder="param.description"
              v-model="localConfig.params[param.name]"
              :required="param.required"
              @input="emitUpdate"
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            <p v-if="param.description" class="text-xs text-gray-500 mt-1">{{ param.description }}</p>
        </div>
    </div>
     <div v-if="workspaceStore.loading" class="text-center text-sm text-gray-500 py-4">
        Loading configuration...
     </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, reactive, onMounted } from 'vue';
import { useWorkspaceStore } from '~/stores/workspace';
import type { WorkspaceLaunchConfig } from '~/types/TeamLaunchProfile';

type NewWorkspaceConfig = NonNullable<WorkspaceLaunchConfig['newWorkspaceConfig']>;

const props = defineProps<{  modelValue: NewWorkspaceConfig;
}>();

const emit = defineEmits(['update:modelValue']);

const workspaceStore = useWorkspaceStore();

const localConfig = reactive<NewWorkspaceConfig>({ ...props.modelValue });

const selectedSchema = computed(() => {
  if (!localConfig.typeName) return null;
  return workspaceStore.availableWorkspaceTypes.find(t => t.name === localConfig.typeName)?.config_schema;
});

onMounted(() => {
    // If no type is selected but types are available, select the first one.
    if (!localConfig.typeName && workspaceStore.availableWorkspaceTypes.length > 0) {
        selectNewWorkspaceType(workspaceStore.availableWorkspaceTypes[0].name);
    }
});

const emitUpdate = () => {
  emit('update:modelValue', JSON.parse(JSON.stringify(localConfig)));
};

const selectNewWorkspaceType = (typeName: string) => {
  if (localConfig.typeName === typeName) return;

  localConfig.typeName = typeName;
  const schema = workspaceStore.availableWorkspaceTypes.find(t => t.name === typeName)?.config_schema;
  const newParams: Record<string, any> = {};
  if (schema) {
    for (const param of schema.parameters) {
      newParams[param.name] = param.default_value ?? '';
    }
  }
  localConfig.params = newParams;
  emitUpdate();
};

watch(() => props.modelValue, (newVal) => {
  Object.assign(localConfig, newVal);
}, { deep: true });

const getHtmlInputType = (paramType: string) => {
  switch(paramType) {
    case 'INTEGER': return 'number';
    case 'BOOLEAN': return 'checkbox';
    default: return 'text';
  }
};

const capitalize = (value: string) => {
  if (!value) return '';
  value = value.toString();
  return value.charAt(0).toUpperCase() + value.slice(1);
};
</script>
