<template>
  <form @submit.prevent="handleSubmit" class="space-y-8 bg-white p-8 rounded-lg shadow-md border border-gray-200">
    <!-- Basic Info -->
    <fieldset class="space-y-6">
      <div>
        <label for="name" class="block text-base font-medium text-gray-800">Team Name</label>
        <input type="text" id="name" v-model="formData.name" required class="mt-2 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g., Quality Assurance Squad" />
        <p v-if="formErrors.name" class="text-sm text-red-500 mt-1">{{ formErrors.name }}</p>
      </div>
      <div>
        <label for="role" class="block text-base font-medium text-gray-800">Team Role</label>
        <input type="text" id="role" v-model="formData.role" class="mt-2 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g., Code Review and Testing" />
      </div>
      <div>
        <label for="description" class="block text-base font-medium text-gray-800">Team Description</label>
        <textarea id="description" v-model="formData.description" required rows="3" class="mt-2 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="A detailed description of the team's purpose and responsibilities."></textarea>
        <p v-if="formErrors.description" class="text-sm text-red-500 mt-1">{{ formErrors.description }}</p>
      </div>
    </fieldset>

    <!-- Team Members -->
    <fieldset class="border-t border-gray-200 pt-8">
      <legend class="text-xl font-semibold text-gray-900">Team Composition</legend>
      <div v-if="formData.nodes.length === 0" class="text-center py-6 px-4 bg-gray-50 rounded-lg mt-4">
        <p class="text-gray-500">This team has no members yet.</p>
        <p class="text-sm text-gray-400">Click "Add Member" to start building your team.</p>
      </div>
      <div v-if="formErrors.nodes" class="text-sm text-red-500 mt-2">{{ formErrors.nodes }}</div>
      <div class="space-y-4 mt-4">
        <div v-for="(node, index) in formData.nodes" :key="index" class="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <!-- Member Name -->
            <div>
              <label :for="`member-name-${index}`" class="block text-sm font-medium text-gray-700">Member Name *</label>
              <input :id="`member-name-${index}`" type="text" v-model="node.memberName" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="e.g., Developer" />
              <p v-if="formErrors[`node_${index}_memberName`]" class="text-sm text-red-500 mt-1">{{ formErrors[`node_${index}_memberName`] }}</p>
            </div>
            <!-- Type -->
            <div>
              <label :for="`member-type-${index}`" class="block text-sm font-medium text-gray-700">Type *</label>
              <select :id="`member-type-${index}`" v-model="node.referenceType" @change="node.referenceId = ''" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                <option value="AGENT">Agent</option>
                <option value="AGENT_TEAM">Agent Team</option>
              </select>
            </div>
            <!-- Blueprint -->
            <div class="md:col-span-2">
              <label :for="`member-blueprint-${index}`" class="block text-sm font-medium text-gray-700">
                {{ node.referenceType === 'AGENT' ? 'Agent' : 'Team' }} *
              </label>
              <select :id="`member-blueprint-${index}`" v-model="node.referenceId" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                <option value="" disabled>{{ node.referenceType === 'AGENT' ? 'Select an agent...' : 'Select a team...' }}</option>
                <option v-for="bp in blueprintOptions(node.referenceType)" :key="bp.id" :value="bp.id">{{ bp.name }}</option>
              </select>
              <p v-if="formErrors[`node_${index}_referenceId`]" class="text-sm text-red-500 mt-1">{{ formErrors[`node_${index}_referenceId`] }}</p>
            </div>
            <!-- Dependencies -->
            <div class="md:col-span-2">
                <label :for="`member-dependencies-${index}`" class="block text-sm font-medium text-gray-700">Dependencies</label>
                <p class="text-xs text-gray-500 mb-2">Select other members this member depends on.</p>
                <GroupableTagInput
                    :model-value="node.dependencies"
                    @update:model-value="node.dependencies = $event"
                    :source="{ type: 'flat', tags: availableDependencies(index).map(d => ({ name: d.memberName, isMandatory: false })) }"
                    placeholder="Select dependencies..."
                />
            </div>
          </div>
          <div class="text-right mt-4 pt-4 border-t border-gray-200">
            <button type="button" @click="removeNode(index)" class="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">Remove Member</button>
          </div>
        </div>
      </div>
      <button type="button" @click="addNode" class="mt-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">Add Member</button>
    </fieldset>

    <!-- Coordinator Selection -->
    <fieldset class="border-t border-gray-200 pt-8">
      <legend class="text-xl font-semibold text-gray-900">Coordinator</legend>
      <div class="mt-4">
        <label for="coordinator" class="block text-base font-medium text-gray-800">Select Coordinator *</label>
        <p class="text-sm text-gray-500 mb-2">The coordinator is an agent responsible for managing the team's workflow.</p>
        <select id="coordinator" v-model="formData.coordinatorMemberName" required class="block w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" :disabled="coordinatorOptions.length === 0">
          <option value="" disabled>{{ coordinatorOptions.length > 0 ? 'Select a coordinator...' : 'Add an AGENT type member first' }}</option>
          <option v-for="coord in coordinatorOptions" :key="coord.memberName" :value="coord.memberName">{{ coord.memberName }}</option>
        </select>
        <p v-if="formErrors.coordinatorMemberName" class="text-sm text-red-500 mt-1">{{ formErrors.coordinatorMemberName }}</p>
      </div>
    </fieldset>

    <!-- Actions -->
    <div class="flex justify-end pt-8 mt-8 border-t border-gray-200 space-x-4">
      <button type="button" @click="$emit('cancel')" class="inline-flex justify-center py-3 px-6 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">Cancel</button>
      <button type="submit" :disabled="isSubmitting" class="inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
        <span v-if="isSubmitting" class="animate-spin h-5 w-5 mr-3 i-heroicons-arrow-path-20-solid"></span>
        {{ submitButtonText }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { reactive, watch, toRefs, computed, onMounted } from 'vue';
import { useAgentDefinitionStore } from '~/stores/agentDefinitionStore';
import { useAgentTeamDefinitionStore, type TeamMemberInput } from '~/stores/agentTeamDefinitionStore';
import GroupableTagInput from '~/components/agents/GroupableTagInput.vue';

const props = defineProps<{
  initialData?: any;
  isSubmitting: boolean;
  submitButtonText: string;
}>();

const emit = defineEmits(['submit', 'cancel']);
const { initialData } = toRefs(props);

// Stores
const agentDefStore = useAgentDefinitionStore();
const agentTeamDefStore = useAgentTeamDefinitionStore();

// Form Data
const getInitialFormData = () => ({
  name: '',
  role: '',
  description: '',
  coordinatorMemberName: '',
  nodes: [] as TeamMemberInput[],
});
const formData = reactive(getInitialFormData());
const formErrors = reactive<Record<string, string>>({});

// --- LOGIC AND HELPER FUNCTIONS ---

const validateForm = () => {
  Object.keys(formErrors).forEach(key => delete formErrors[key]);
  let isValid = true;

  if (!formData.name) {
    formErrors.name = 'Team name is required.';
    isValid = false;
  }
  if (!formData.description) {
    formErrors.description = 'Team description is required.';
    isValid = false;
  }
  if (formData.nodes.length === 0) {
    formErrors.nodes = 'A team must have at least one member.';
    isValid = false;
  } else {
    const memberNames = new Set<string>();
    formData.nodes.forEach((node, index) => {
      if (!node.memberName) {
        formErrors[`node_${index}_memberName`] = 'Member name is required.';
        isValid = false;
      } else if (memberNames.has(node.memberName)) {
        formErrors[`node_${index}_memberName`] = 'Member name must be unique.';
        isValid = false;
      }
      if (!node.referenceId) {
          formErrors[`node_${index}_referenceId`] = node.referenceType === 'AGENT' ? 'An agent must be selected.' : 'A team must be selected.';
          isValid = false;
      }
      memberNames.add(node.memberName);
    });
  }
  if (!formData.coordinatorMemberName) {
    formErrors.coordinatorMemberName = 'A coordinator must be selected.';
    isValid = false;
  } else if (!coordinatorOptions.value.some(opt => opt.memberName === formData.coordinatorMemberName)) {
    formErrors.coordinatorMemberName = 'The selected coordinator is no longer a valid agent member.';
    isValid = false;
  }
  return isValid;
};

const addNode = () => {
  formData.nodes.push({
    memberName: '',
    referenceType: 'AGENT',
    referenceId: '',
    dependencies: [],
  });
};

const removeNode = (index: number) => {
  const removedNodeName = formData.nodes[index].memberName;
  formData.nodes.splice(index, 1);
  if (formData.coordinatorMemberName === removedNodeName) {
    formData.coordinatorMemberName = '';
  }
  formData.nodes.forEach(node => {
    if (node.dependencies) {
      const depIndex = node.dependencies.indexOf(removedNodeName);
      if (depIndex > -1) {
        node.dependencies.splice(depIndex, 1);
      }
    }
  });
};

const handleSubmit = () => {
  if (!validateForm()) {
    return;
  }
  const submissionData = JSON.parse(JSON.stringify(formData));
  emit('submit', submissionData);
};

// --- COMPUTED PROPERTIES ---

const blueprintOptions = (type: 'AGENT' | 'AGENT_TEAM') => {
  return type === 'AGENT' ? agentDefStore.agentDefinitions : agentTeamDefStore.agentTeamDefinitions;
};

const coordinatorOptions = computed(() => {
  return formData.nodes.filter(n => n.referenceType === 'AGENT' && n.memberName);
});

const availableDependencies = (currentIndex: number) => {
  const currentNodeName = formData.nodes[currentIndex].memberName;
  return formData.nodes.filter((node, index) => index !== currentIndex && node.memberName && node.memberName !== currentNodeName);
};


// --- LIFECYCLE & WATCHERS ---

onMounted(() => {
  if (agentDefStore.agentDefinitions.length === 0) {
    agentDefStore.fetchAllAgentDefinitions();
  }
  if (agentTeamDefStore.agentTeamDefinitions.length === 0) {
    agentTeamDefStore.fetchAllAgentTeamDefinitions();
  }
});

watch(initialData, (newData) => {
  Object.keys(formErrors).forEach(key => delete formErrors[key]);
  Object.assign(formData, getInitialFormData());
  if (newData) {
    formData.name = newData.name || '';
    formData.role = newData.role || '';
    formData.description = newData.description || '';
    formData.coordinatorMemberName = newData.coordinatorMemberName || '';
    formData.nodes = JSON.parse(JSON.stringify(newData.nodes || []));
  }
}, { immediate: true, deep: true });
</script>
