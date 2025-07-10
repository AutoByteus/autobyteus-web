<template>
  <div class="flex-1 overflow-auto p-8">
    <div class="max-w-full mx-auto">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">My Sessions</h1>
          <p class="text-gray-500 mt-1">Manage active and past sessions.</p>
        </div>
      </div>

      <div v-if="isRestoring" class="text-center py-20">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4"></div>
        <p>Restoring session and preparing workspace...</p>
      </div>
      
      <div v-else>
        <!-- Active Sessions -->
        <div class="mb-12">
          <h2 class="text-xl font-semibold text-gray-800 mb-4">Active Sessions</h2>
          <div v-if="activeSessions.length === 0" class="text-center bg-gray-50 rounded-lg py-12 px-6 border border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">No Active Sessions</h3>
            <p class="mt-1 text-sm text-gray-500">Resume a session from your past sessions list, or start a new one from the "Local Agents" page.</p>
          </div>
          <div v-else class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <div 
              v-for="session in activeSessions" 
              :key="session.sessionId"
              class="bg-white rounded-lg border border-gray-200 p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-lg hover:border-blue-400 cursor-pointer"
              @click="openSession(session.sessionId)"
            >
              <div>
                <h3 class="font-semibold text-base text-gray-800 truncate" :title="session.name">{{ session.name }}</h3>
                <p class="text-sm text-gray-600 mt-1">
                  Agent: <span class="font-medium">{{ session.agentDefinition.name }}</span>
                </p>
                <p class="text-xs text-gray-500 mt-2">
                  Created: {{ new Date(session.createdAt).toLocaleString() }}
                </p>
                <p class="text-xs text-gray-500 mt-1">
                  Workspace Type: <span class="font-mono text-xs bg-gray-100 px-1 rounded">{{ session.workspaceTypeName }}</span>
                </p>
              </div>

              <div class="mt-6 flex items-center justify-end space-x-3 border-t border-gray-200 pt-4">
                <button @click.stop="promptDelete(session)" class="px-3 py-1.5 text-sm font-semibold text-red-700 bg-red-50 rounded-md hover:bg-red-100 transition-colors">
                  Delete
                </button>
                <button @click="openSession(session.sessionId)" class="px-3 py-1.5 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
                  Open
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Past Sessions -->
        <div>
          <h2 class="text-xl font-semibold text-gray-800 mb-4">Past Sessions</h2>
          <div v-if="pastSessions.length === 0 && activeSessions.length > 0" class="text-center bg-gray-50 rounded-lg py-12 px-6 border border-gray-200">
             <h3 class="text-lg font-medium text-gray-900">No Past Sessions</h3>
             <p class="mt-1 text-sm text-gray-500">Your session history is clear.</p>
          </div>
          <div v-else-if="pastSessions.length === 0 && activeSessions.length === 0" class="text-center bg-gray-50 rounded-lg py-12 px-6 border border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">No Saved Sessions</h3>
            <p class="mt-1 text-sm text-gray-500">
              Start a new session from the "Local Agents" list to see it here.
            </p>
          </div>
          <div v-else class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
             <div 
               v-for="session in pastSessions" 
               :key="session.sessionId"
               class="bg-gray-50 rounded-lg border border-gray-200 p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-lg hover:border-gray-300 cursor-pointer"
               @click="resumeSession(session.sessionId)"
             >
              <div>
                <h3 class="font-semibold text-base text-gray-800 truncate" :title="session.name">{{ session.name }}</h3>
                <p class="text-sm text-gray-600 mt-1">
                  Agent: <span class="font-medium">{{ session.agentDefinition.name }}</span>
                </p>
                <p class="text-xs text-gray-500 mt-2">
                  Created: {{ new Date(session.createdAt).toLocaleString() }}
                </p>
                <p class="text-xs text-gray-500 mt-1">
                  Workspace Type: <span class="font-mono text-xs bg-gray-100 px-1 rounded">{{ session.workspaceTypeName }}</span>
                </p>
              </div>

              <div class="mt-6 flex items-center justify-end space-x-3 border-t border-gray-200 pt-4">
                <button @click.stop="promptDelete(session)" class="px-3 py-1.5 text-sm font-semibold text-red-700 bg-red-50 rounded-md hover:bg-red-100 transition-colors">
                  Delete
                </button>
                <button @click="resumeSession(session.sessionId)" class="px-3 py-1.5 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
                  Resume Session
                </button>
              </div>
             </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Agent Delete Confirmation Dialog -->
    <AgentDeleteConfirmDialog
      :show="showDeleteConfirm"
      :target-name="sessionToDelete ? sessionToDelete.name : ''"
      @confirm="onDeleteConfirmed"
      @cancel="onDeleteCanceled"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useAgentSessionStore, type AgentSession } from '~/stores/agentSessionStore';
import { useWorkspaceStore } from '~/stores/workspace';
import AgentDeleteConfirmDialog from '~/components/agents/AgentDeleteConfirmDialog.vue';

const sessionStore = useAgentSessionStore();
const workspaceStore = useWorkspaceStore();
const router = useRouter();

onMounted(() => {
  sessionStore.loadSessions();
});

const allSessions = computed(() => sessionStore.sessionList);
const activeWorkspaceIds = computed(() => workspaceStore.allWorkspaceIds);

const activeSessions = computed(() => 
  allSessions.value.filter(s => s.workspaceId && activeWorkspaceIds.value.includes(s.workspaceId))
);

const pastSessions = computed(() => 
  allSessions.value.filter(s => !s.workspaceId || !activeWorkspaceIds.value.includes(s.workspaceId))
);

const isRestoring = ref(false);
const showDeleteConfirm = ref(false);
const sessionToDelete = ref<AgentSession | null>(null);

const openSession = async (sessionId: string) => {
  sessionStore.setActiveSession(sessionId);
  await router.push('/workspace');
};

const resumeSession = async (sessionId: string) => {
  isRestoring.value = true;
  try {
    const success = await sessionStore.restoreSession(sessionId);
    if (success) {
      await router.push('/workspace');
    } else {
      // Alert is handled inside the store action for legacy sessions.
      // For other failures, a more robust notification system would be ideal.
      alert('Failed to resume session. Please check the console for details.');
    }
  } catch (error) {
    console.error('An error occurred while trying to resume the session:', error);
    alert('An unexpected error occurred. Please try again.');
  } finally {
    isRestoring.value = false;
  }
};

const promptDelete = (session: AgentSession) => {
  sessionToDelete.value = session;
  showDeleteConfirm.value = true;
};

const onDeleteConfirmed = () => {
  if (sessionToDelete.value) {
    sessionStore.deleteSession(sessionToDelete.value.sessionId);
  }
  onDeleteCanceled();
};

const onDeleteCanceled = () => {
  showDeleteConfirm.value = false;
  sessionToDelete.value = null;
};
</script>
