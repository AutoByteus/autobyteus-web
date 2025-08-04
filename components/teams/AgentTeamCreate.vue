<template>
  <div class="p-8">
    <div class="max-w-6xl mx-auto">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Create New Agent Team</h1>
        <p class="text-lg text-gray-500 mt-2">Define a new team by assembling agents and other teams into a cohesive unit.</p>
      </div>

      <AgentTeamDefinitionForm
        :is-submitting="isSubmitting"
        submit-button-text="Create Team"
        @submit="handleCreate"
        @cancel="handleCancel"
      />

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
import { ref } from 'vue';
import { useAgentTeamDefinitionStore, type CreateAgentTeamDefinitionInput } from '~/stores/agentTeamDefinitionStore';
import AgentTeamDefinitionForm from '~/components/teams/AgentTeamDefinitionForm.vue';

const emit = defineEmits(['navigate']);

const store = useAgentTeamDefinitionStore();
const isSubmitting = ref(false);
const notification = ref<{ type: 'success' | 'error'; message: string } | null>(null);

const handleCreate = async (formData: CreateAgentTeamDefinitionInput) => {
  isSubmitting.value = true;
  notification.value = null;

  try {
    const newTeam = await store.createAgentTeamDefinition(formData);
    if (newTeam) {
      showNotification('Agent team created successfully!', 'success');
      setTimeout(() => {
        emit('navigate', { view: 'team-detail', id: newTeam.id });
      }, 1500);
    } else {
      throw new Error('Failed to create agent team. The result was empty.');
    }
  } catch (error: any) {
    console.error('Failed to create agent team:', error);
    showNotification(error.message || 'An unexpected error occurred.', 'error');
  } finally {
    isSubmitting.value = false;
  }
};

const handleCancel = () => {
  emit('navigate', { view: 'team-list' });
};

const showNotification = (message: string, type: 'success' | 'error') => {
  notification.value = { message, type };
  setTimeout(() => {
    notification.value = null;
  }, 3000);
};
</script>
