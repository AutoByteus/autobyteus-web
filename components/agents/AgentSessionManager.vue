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

        <!-- Inactive Sessions -->
        <div>
          <h2 class="text-xl font-semibold text-gray-800 mb-4">Inactive Sessions</h2>
          <div v-if="inactiveSessions.length === 0 && activeSessions.length > 0" class="text-center bg-gray-50 rounded-lg py-12 px-6 border border-gray-200">
             <h3 class="text-lg font-medium text-gray-900">No Inactive Sessions</h3>
             <p class="mt-1 text-sm text-gray-500">Your session history is clear.</p>
          </div>
          <div v-else-if="inactiveSessions.length === 0 && activeSessions.length === 0" class="text-center bg-gray-50 rounded-lg py-12 px-6 border border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">No Saved Sessions</h3>
            <p class="mt-1 text-sm text-gray-500">
              Start a new session from the "Local Agents" list to see it here.
            </p>
          </div>
          <div v-else class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
             <div 
               v-for="session in inactiveSessions" 
               :key="session.sessionId"
               class="bg-gray-50 rounded-lg border border-gray-200 p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-lg hover:border-gray-300 cursor-pointer"
               @click="promptResume(session)"
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
                <button @click.stop="promptResume(session)" class="px-3 py-1.5 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
                  Resume Session
                </button>
              </div>
             </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Resume Session Dialog -->
    <ResumeSessionDialog
      :show="showResumeDialog"
      :session="sessionToResume"
      @confirm="handleResumeConfirm"
      @cancel="handleResumeCancel"
    />

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
import { useAgentSessionStore, type AgentSession, SESSION_STORAGE_KEY } from '~/stores/agentSessionStore';
import { useWorkspaceStore } from '~/stores/workspace';
import AgentDeleteConfirmDialog from '~/components/agents/AgentDeleteConfirmDialog.vue';
import ResumeSessionDialog from '~/components/agents/ResumeSessionDialog.vue';

const sessionStore = useAgentSessionStore();
const workspaceStore = useWorkspaceStore();
const router = useRouter();

onMounted(() => {
  try {
    const storedSessionsJSON = localStorage.getItem(SESSION_STORAGE_KEY);
    const allSessions = storedSessionsJSON ? JSON.parse(storedSessionsJSON) : {};
    const activeWorkspaceIds = workspaceStore.allWorkspaceIds;
    sessionStore.partitionSessions(allSessions, activeWorkspaceIds);
  } catch (error) {
    console.error("Failed to load and partition sessions in component:", error);
    sessionStore.partitionSessions({}, []);
  }
});

const activeSessions = computed(() => sessionStore.activeSessionList);
const inactiveSessions = computed(() => sessionStore.inactiveSessionList);

const isRestoring = ref(false);
const showDeleteConfirm = ref(false);
const sessionToDelete = ref<AgentSession | null>(null);

const showResumeDialog = ref(false);
const sessionToResume = ref<AgentSession | null>(null);

const openSession = async (sessionId: string) => {
  sessionStore.setActiveSession(sessionId);
  await router.push('/workspace');
};

const promptResume = (session: AgentSession) => {
  if (isRestoring.value) return;
  sessionToResume.value = session;
  showResumeDialog.value = true;
};

const handleResumeCancel = () => {
  showResumeDialog.value = false;
  sessionToResume.value = null;
};

const handleResumeConfirm = async (payload: { choice: 'recreate' | 'attach', workspaceId?: string }) => {
  if (!sessionToResume.value) return;

  isRestoring.value = true;
  showResumeDialog.value = false;
  
  const sessionId = sessionToResume.value.sessionId;

  try {
    // The component now calls the single orchestrator function, passing the dialog's payload directly.
    // The business logic is now encapsulated in the store.
    const success = await sessionStore.resumeInactiveSession(sessionId, payload);
    
    if (success) {
      await router.push('/workspace');
    } else {
      alert('Failed to resume session. Please check the console for details.');
    }
  } catch (error) {
    console.error('An error occurred while trying to resume the session:', error);
    alert('An unexpected error occurred. Please try again.');
  } finally {
    isRestoring.value = false;
    sessionToResume.value = null;
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
