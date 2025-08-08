<template>
  <div class="flex-1 overflow-auto p-8">
    <div class="max-w-6xl mx-auto">
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-20">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
        <p class="mt-4 text-gray-600">Loading Agent Team Details...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="!teamDef" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
        <h3 class="font-bold">Agent Team Not Found</h3>
        <p>The agent team definition with the specified ID could not be found.</p>
        <button @click="$emit('navigate', { view: 'team-list' })" class="text-indigo-600 hover:underline mt-2 inline-block">&larr; Back to all teams</button>
      </div>

      <!-- Content -->
      <div v-else>
        <div class="bg-white p-8 rounded-lg shadow-md border border-gray-200">
          <!-- Header -->
          <div class="flex justify-between items-start mb-6 pb-6 border-b border-gray-200">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">{{ teamDef.name }}</h1>
              <p class="text-md text-gray-500 mt-1">{{ teamDef.role || 'No role specified' }}</p>
            </div>
            <div class="flex space-x-2">
              <button @click="openLaunchModal" class="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors flex items-center">
                Run Team
              </button>
              <button @click="$emit('navigate', { view: 'team-edit', id: teamDef.id })" class="px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-md hover:bg-gray-200 transition-colors flex items-center">
                Edit
              </button>
              <button @click="handleDelete(teamDef.id)" class="px-4 py-2 bg-red-50 text-red-700 font-semibold rounded-md hover:bg-red-100 transition-colors flex items-center">
                Delete
              </button>
            </div>
          </div>
          
          <!-- Description -->
          <div class="mb-8">
            <h2 class="text-lg font-semibold text-gray-800 mb-2">Description</h2>
            <p class="text-gray-600 whitespace-pre-wrap">{{ teamDef.description }}</p>
          </div>

          <!-- Members -->
          <div>
            <h2 class="text-lg font-semibold text-gray-800 mb-4">Members ({{ teamDef.nodes.length }})</h2>
            <div class="space-y-4">
              <div v-for="node in teamDef.nodes" :key="node.memberName" class="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div class="flex items-center justify-between">
                  <h3 class="text-base font-bold flex items-center" :class="node.referenceType === 'AGENT' ? 'text-blue-800' : 'text-purple-800'">
                    <span :class="['w-2 h-2 rounded-full mr-3', node.referenceType === 'AGENT' ? 'bg-blue-500' : 'bg-purple-500']"></span>
                    {{ node.memberName }}
                    <span v-if="node.memberName === teamDef.coordinatorMemberName" class="ml-3 text-xs font-bold text-yellow-800 bg-yellow-200 px-2 py-0.5 rounded-full">
                      COORDINATOR
                    </span>
                  </h3>
                  <span class="text-xs font-mono px-2 py-1 rounded" :class="node.referenceType === 'AGENT' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'">
                    {{ node.referenceType }}
                  </span>
                </div>
                <div class="mt-4 pl-5 space-y-3">
                  <div>
                    <p class="text-xs font-semibold text-gray-500">{{ node.referenceType === 'AGENT' ? 'Agent' : 'Team' }}</p>
                    <p class="text-sm text-gray-700 mt-1">{{ getBlueprintName(node.referenceType, node.referenceId) }}</p>
                  </div>
                  <div>
                    <p class="text-xs font-semibold text-gray-500">Dependencies</p>
                    <div v-if="node.dependencies && node.dependencies.length" class="flex flex-wrap gap-2 mt-1">
                      <span v-for="dep in node.dependencies" :key="dep" class="text-sm bg-gray-200 text-gray-700 px-2 py-1 rounded">
                        {{ dep }}
                      </span>
                    </div>
                    <p v-else class="text-sm text-gray-500 italic mt-1">None</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Delete Confirmation Dialog -->
    <AgentDeleteConfirmDialog
      :show="showDeleteConfirm"
      :item-name="teamDef ? teamDef.name : ''"
      item-type="Agent Team Definition"
      title="Delete Agent Team Definition"
      confirm-text="Delete Definition"
      @confirm="onDeleteConfirmed"
      @cancel="onDeleteCanceled"
    />

    <!-- Team Launch Modal -->
    <TeamLaunchConfigModal
      v-if="isLaunchModalOpen && teamDef"
      :show="isLaunchModalOpen"
      :team-definition="teamDef"
      @close="isLaunchModalOpen = false"
      @success="onLaunchSuccess"
    />

    <!-- Notification -->
    <div v-if="notification"
        :class="[
          'fixed bottom-5 right-5 p-4 rounded-lg shadow-lg text-white z-50',
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        ]">
      {{ notification.message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, toRefs } from 'vue';
import { useAgentTeamDefinitionStore } from '~/stores/agentTeamDefinitionStore';
import { useAgentDefinitionStore } from '~/stores/agentDefinitionStore';
import AgentDeleteConfirmDialog from '~/components/agents/AgentDeleteConfirmDialog.vue';
import TeamLaunchConfigModal from '~/components/agentTeams/TeamLaunchConfigModal.vue';

const props = defineProps<{ teamId: string }>();
const { teamId } = toRefs(props);

const emit = defineEmits(['navigate']);

const store = useAgentTeamDefinitionStore();
const agentDefStore = useAgentDefinitionStore();
const router = useRouter();

const teamDef = computed(() => store.getAgentTeamDefinitionById(teamId.value));
const loading = ref(false);

const notification = ref<{ type: 'success' | 'error'; message: string } | null>(null);
const showDeleteConfirm = ref(false);
const teamIdToDelete = ref<string | null>(null);
const isLaunchModalOpen = ref(false);

onMounted(async () => {
  loading.value = true;
  await Promise.all([
    store.fetchAllAgentTeamDefinitions(),
    agentDefStore.fetchAllAgentDefinitions()
  ]);
  loading.value = false;
});

const getBlueprintName = (type: 'AGENT' | 'AGENT_TEAM', id: string): string => {
  if (type === 'AGENT') {
    return agentDefStore.getAgentDefinitionById(id)?.name || `Unknown Agent (ID: ${id})`;
  } else {
    return store.getAgentTeamDefinitionById(id)?.name || `Unknown Team (ID: ${id})`;
  }
};

const openLaunchModal = () => {
  isLaunchModalOpen.value = true;
};

const onLaunchSuccess = () => {
  isLaunchModalOpen.value = false;
  // Navigate to the main workspace view. The correct profile will be active.
  router.push('/workspace');
};

const handleDelete = (id: string) => {
  teamIdToDelete.value = id;
  showDeleteConfirm.value = true;
};

const onDeleteConfirmed = async () => {
  if (teamIdToDelete.value) {
    try {
      const success = await store.deleteAgentTeamDefinition(teamIdToDelete.value);
      if (success) {
        showNotification('Agent team definition deleted successfully.', 'success');
        setTimeout(() => emit('navigate', { view: 'team-list' }), 1500);
      } else {
        throw new Error('Deletion failed for an unknown reason.');
      }
    } catch (err: any) {
      showNotification(err.message || 'Failed to delete agent team definition.', 'error');
    }
  }
  onDeleteCanceled();
};

const onDeleteCanceled = () => {
  showDeleteConfirm.value = false;
  teamIdToDelete.value = null;
};

const showNotification = (message: string, type: 'success' | 'error') => {
  notification.value = { message, type };
  setTimeout(() => {
    notification.value = null;
  }, 3000);
};
</script>
