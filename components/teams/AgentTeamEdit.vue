<template>
  <div class="p-8">
    <div class="max-w-6xl mx-auto">
      <div v-if="teamDef">
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900">Edit Agent Team Definition</h1>
          <p class="text-lg text-gray-500 mt-2">Update the details for "{{ teamDef.name }}".</p>
        </div>

        <AgentTeamDefinitionForm
          :initial-data="teamDef"
          :is-submitting="isSubmitting"
          submit-button-text="Save Changes"
          @submit="handleUpdate"
          @cancel="handleCancel"
        />
      </div>
       <div v-else-if="loading" class="text-center py-10">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4"></div>
        <p>Loading agent team definition...</p>
      </div>
      <div v-else class="bg-red-50 border border-red-200 text-red-700 rounded-md p-4">
        <p class="font-bold">Error:</p>
        <p>Agent team definition not found.</p>
      </div>

      <div v-if="notification"
           :class="[
             'fixed bottom-5 right-5 p-4 rounded-lg shadow-lg text-white z-50',
             notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
           ]">
        {{ notification.message }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, toRefs } from 'vue';
import { useAgentTeamDefinitionStore, type UpdateAgentTeamDefinitionInput } from '~/stores/agentTeamDefinitionStore';
import AgentTeamDefinitionForm from '~/components/teams/AgentTeamDefinitionForm.vue';

const props = defineProps<{ teamId: string }>();
const { teamId } = toRefs(props);

const emit = defineEmits(['navigate']);

const store = useAgentTeamDefinitionStore();
const teamDef = computed(() => store.getAgentTeamDefinitionById(teamId.value));
const loading = ref(false);
const isSubmitting = ref(false);
const notification = ref<{ type: 'success' | 'error'; message: string } | null>(null);

onMounted(async () => {
  if (store.agentTeamDefinitions.length === 0) {
    loading.value = true;
    await store.fetchAllAgentTeamDefinitions();
    loading.value = false;
  }
});

const handleUpdate = async (formData: any) => {
  isSubmitting.value = true;
  notification.value = null;

  const updateInput: UpdateAgentTeamDefinitionInput = {
    id: teamId.value,
    ...formData,
  };

  try {
    const updatedTeam = await store.updateAgentTeamDefinition(updateInput);
    if (updatedTeam) {
      showNotification('Agent team definition updated successfully!', 'success');
      setTimeout(() => {
        emit('navigate', { view: 'team-detail', id: updatedTeam.id });
      }, 1500);
    } else {
      throw new Error('Failed to update agent team definition. The result was empty.');
    }
  } catch (error: any) {
    console.error('Failed to update agent team definition:', error);
    showNotification(error.message || 'An unexpected error occurred.', 'error');
  } finally {
    isSubmitting.value = false;
  }
};

const handleCancel = () => {
  emit('navigate', { view: 'team-detail', id: props.teamId });
};

const showNotification = (message: string, type: 'success' | 'error') => {
  notification.value = { message, type };
  setTimeout(() => {
    notification.value = null;
  }, 3000);
};
</script>
