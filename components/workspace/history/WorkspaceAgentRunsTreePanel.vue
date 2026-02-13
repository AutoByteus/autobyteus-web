<template>
  <div class="flex h-full flex-col bg-white">
    <div class="flex items-center justify-between border-t border-gray-200 px-3 py-2">
      <h3 class="text-sm font-semibold text-gray-700">Workspaces</h3>
      <button
        type="button"
        class="inline-flex h-6 w-6 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
        title="Add workspace"
        @click="onCreateWorkspace"
      >
        <Icon icon="heroicons:plus-20-solid" class="h-4 w-4" />
      </button>
    </div>

    <form
      v-if="showCreateWorkspaceInline"
      class="border-t border-gray-100 px-3 py-2"
      data-test="create-workspace-form"
      @submit.prevent="confirmCreateWorkspace"
    >
      <div class="space-y-2">
        <input
          id="workspace-path-input"
          ref="workspacePathInputRef"
          v-model="workspacePathDraft"
          data-test="workspace-path-input"
          type="text"
          class="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-200 disabled:cursor-not-allowed disabled:bg-gray-100"
          :class="workspacePathError ? 'border-red-300 focus:border-red-300 focus:ring-red-200' : ''"
          placeholder="/Users/you/project"
          :disabled="creatingWorkspace"
          @keydown.enter.prevent="confirmCreateWorkspace"
          @keydown.esc.prevent="closeCreateWorkspaceInput"
        >
        <p v-if="workspacePathError" class="text-xs text-red-600">
          {{ workspacePathError }}
        </p>
        <div class="flex items-center justify-end gap-2">
          <button
            data-test="cancel-create-workspace"
            type="button"
            class="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="creatingWorkspace"
            @click="closeCreateWorkspaceInput"
          >
            Cancel
          </button>
          <button
            data-test="confirm-create-workspace"
            type="submit"
            class="rounded-md border border-indigo-200 bg-white px-3 py-1.5 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="creatingWorkspace"
          >
            {{ creatingWorkspace ? 'Adding...' : 'Add' }}
          </button>
        </div>
      </div>
    </form>

    <div class="min-h-0 flex-1 overflow-y-auto px-1 pb-2">
      <div v-if="runHistoryStore.loading" class="px-3 py-4 text-xs text-gray-500">
        Loading task history...
      </div>

      <div v-else-if="runHistoryStore.error" class="px-3 py-4 text-xs text-red-600">
        {{ runHistoryStore.error }}
      </div>

      <div
        v-else-if="workspaceNodes.length === 0"
        class="px-3 py-4 text-xs text-gray-500"
      >
        No run history yet.
      </div>

      <div v-else class="space-y-1">
        <section
          v-for="workspaceNode in workspaceNodes"
          :key="workspaceNode.workspaceRootPath"
          class="rounded-md"
        >
          <button
            type="button"
            class="flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
            @click="toggleWorkspace(workspaceNode.workspaceRootPath)"
          >
            <Icon
              icon="heroicons:chevron-down-20-solid"
              class="mr-1.5 h-4 w-4 text-gray-400 transition-transform"
              :class="isWorkspaceExpanded(workspaceNode.workspaceRootPath) ? 'rotate-0' : '-rotate-90'"
            />
            <Icon icon="heroicons:folder-20-solid" class="mr-1.5 h-4 w-4 text-gray-500" />
            <span class="truncate">{{ workspaceNode.workspaceName }}</span>
          </button>

          <div v-if="isWorkspaceExpanded(workspaceNode.workspaceRootPath)" class="ml-2 mt-0.5 space-y-1">
            <div
              v-if="workspaceNode.agents.length === 0"
              class="px-3 py-1 text-xs text-gray-400"
            >
              No task history in this workspace.
            </div>

            <div
              v-for="agentNode in workspaceNode.agents"
              :key="agentNode.agentDefinitionId"
              class="rounded-md"
            >
              <div
                class="flex items-center justify-between rounded-md px-2 py-1 text-sm text-gray-700 transition-colors hover:bg-gray-50"
              >
                <button
                  type="button"
                  class="flex min-w-0 flex-1 items-center text-left"
                  @click="toggleAgent(workspaceNode.workspaceRootPath, agentNode.agentDefinitionId)"
                >
                  <Icon
                    icon="heroicons:chevron-down-20-solid"
                    class="mr-1 h-3.5 w-3.5 text-gray-400 transition-transform"
                    :class="isAgentExpanded(workspaceNode.workspaceRootPath, agentNode.agentDefinitionId) ? 'rotate-0' : '-rotate-90'"
                  />
                  <span
                    class="mr-1.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 text-[10px] font-semibold text-gray-600"
                  >
                    <img
                      v-if="showAgentAvatar(workspaceNode.workspaceRootPath, agentNode.agentDefinitionId, agentNode.agentAvatarUrl)"
                      :src="agentNode.agentAvatarUrl || ''"
                      :alt="`${agentNode.agentName} avatar`"
                      class="h-full w-full object-cover"
                      @error="onAgentAvatarError(workspaceNode.workspaceRootPath, agentNode.agentDefinitionId, agentNode.agentAvatarUrl)"
                    >
                    <span v-else>{{ getAgentInitials(agentNode.agentName) }}</span>
                  </span>
                  <span class="truncate font-medium">{{ agentNode.agentName }}</span>
                  <span class="ml-1 text-xs text-gray-400">({{ agentNode.runs.length }})</span>
                </button>

                <button
                  type="button"
                  class="ml-2 inline-flex h-5 w-5 items-center justify-center rounded text-gray-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                  title="New run with this agent"
                  @click="onCreateRun(workspaceNode.workspaceRootPath, agentNode.agentDefinitionId)"
                >
                  <Icon icon="heroicons:plus-20-solid" class="h-4 w-4" />
                </button>
              </div>

              <div
                v-if="isAgentExpanded(workspaceNode.workspaceRootPath, agentNode.agentDefinitionId)"
                class="ml-3 space-y-0.5"
              >
                <button
                  v-for="run in agentNode.runs"
                  :key="run.runId"
                  type="button"
                  class="group/run-row flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition-colors"
                  :class="selectedRunId === run.runId
                    ? 'bg-indigo-50 text-indigo-900'
                    : 'text-gray-700 hover:bg-gray-50'"
                  @click="onSelectRun(run)"
                >
                  <div class="min-w-0 flex items-center">
                    <span
                      v-if="run.isActive"
                      class="mr-2 inline-block h-2 w-2 flex-shrink-0 rounded-full"
                      :class="activeStatusClass"
                    />
                    <span class="truncate">
                      {{ run.summary || 'Untitled task' }}
                    </span>
                  </div>
                  <div class="ml-2 flex flex-shrink-0 items-center gap-1">
                    <button
                      v-if="run.isActive"
                      type="button"
                      class="inline-flex h-5 w-5 items-center justify-center rounded text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                      title="Terminate run"
                      :disabled="Boolean(terminatingRunIds[run.runId])"
                      @click.stop="onTerminateRun(run.runId)"
                    >
                      <Icon icon="heroicons:stop-20-solid" class="h-3.5 w-3.5" />
                    </button>
                    <button
                      v-if="run.source === 'history' && !run.isActive"
                      type="button"
                      class="inline-flex h-5 w-5 items-center justify-center rounded text-gray-400 transition-[opacity,color,background-color] duration-150 hover:bg-red-50 hover:text-red-600 md:opacity-0 md:group-hover/run-row:opacity-100 md:group-focus-within/run-row:opacity-100 disabled:cursor-not-allowed disabled:opacity-50"
                      title="Delete run permanently"
                      :disabled="Boolean(deletingRunIds[run.runId])"
                      @click.stop="onDeleteRun(run)"
                    >
                      <Icon icon="heroicons:trash-20-solid" class="h-3.5 w-3.5" />
                    </button>
                    <span class="text-xs text-gray-400">
                      {{ runHistoryStore.formatRelativeTime(run.lastActivityAt) }}
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>

    <ConfirmationModal
      :show="showDeleteConfirmation"
      title=""
      message="Delete this history permanently. This cannot be undone."
      confirm-button-text="Delete"
      variant="danger"
      typography-size="large"
      @confirm="confirmDeleteRun"
      @cancel="closeDeleteConfirmation"
    />

  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { Icon } from '@iconify/vue';
import ConfirmationModal from '~/components/common/ConfirmationModal.vue';
import { useRunHistoryStore } from '~/stores/runHistoryStore';
import { useWorkspaceStore } from '~/stores/workspace';
import { useAgentSelectionStore } from '~/stores/agentSelectionStore';
import { useAgentRunStore } from '~/stores/agentRunStore';
import { useToasts } from '~/composables/useToasts';
import type { RunTreeRow } from '~/utils/runTreeProjection';

const emit = defineEmits<{
  (e: 'instance-selected', payload: { type: 'agent'; instanceId: string }): void;
  (e: 'instance-created', payload: { type: 'agent'; definitionId: string }): void;
}>();

const runHistoryStore = useRunHistoryStore();
const workspaceStore = useWorkspaceStore();
const selectionStore = useAgentSelectionStore();
const agentRunStore = useAgentRunStore();
const { addToast } = useToasts();

const expandedWorkspace = ref<Record<string, boolean>>({});
const expandedAgents = ref<Record<string, boolean>>({});
const terminatingRunIds = ref<Record<string, boolean>>({});
const deletingRunIds = ref<Record<string, boolean>>({});
const showCreateWorkspaceInline = ref(false);
const workspacePathDraft = ref('');
const workspacePathError = ref('');
const creatingWorkspace = ref(false);
const workspacePathInputRef = ref<HTMLInputElement | null>(null);
const showDeleteConfirmation = ref(false);
const pendingDeleteRunId = ref<string | null>(null);
const brokenAvatarByAgentKey = ref<Record<string, boolean>>({});
const activeStatusClass = 'bg-blue-500 animate-pulse';

const workspaceNodes = computed(() => {
  return runHistoryStore.getTreeNodes();
});

const selectedRunId = computed(() => {
  if (selectionStore.selectedType === 'agent' && selectionStore.selectedInstanceId) {
    return selectionStore.selectedInstanceId;
  }
  return runHistoryStore.selectedRunId;
});

const getAgentNodeKey = (workspaceRootPath: string, agentDefinitionId: string): string => {
  return `${workspaceRootPath}::${agentDefinitionId}`;
};

const getAgentAvatarKey = (
  workspaceRootPath: string,
  agentDefinitionId: string,
  avatarUrl?: string | null,
): string => {
  return `${getAgentNodeKey(workspaceRootPath, agentDefinitionId)}::${(avatarUrl || '').trim()}`;
};

const getAgentInitials = (agentName: string): string => {
  const tokens = (agentName || 'Agent')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (tokens.length === 0) {
    return 'AG';
  }
  return tokens
    .slice(0, 2)
    .map((token) => token.charAt(0).toUpperCase())
    .join('');
};

const showAgentAvatar = (
  workspaceRootPath: string,
  agentDefinitionId: string,
  avatarUrl?: string | null,
): boolean => {
  const key = getAgentAvatarKey(workspaceRootPath, agentDefinitionId, avatarUrl);
  return Boolean((avatarUrl || '').trim()) && !brokenAvatarByAgentKey.value[key];
};

const onAgentAvatarError = (
  workspaceRootPath: string,
  agentDefinitionId: string,
  avatarUrl?: string | null,
): void => {
  const key = getAgentAvatarKey(workspaceRootPath, agentDefinitionId, avatarUrl);
  brokenAvatarByAgentKey.value = {
    ...brokenAvatarByAgentKey.value,
    [key]: true,
  };
};

watch(
  () => runHistoryStore.loading,
  (loading, previousLoading) => {
    if (previousLoading && !loading) {
      brokenAvatarByAgentKey.value = {};
    }
  },
);

const isWorkspaceExpanded = (workspaceRootPath: string): boolean => {
  return expandedWorkspace.value[workspaceRootPath] ?? true;
};

const isAgentExpanded = (workspaceRootPath: string, agentDefinitionId: string): boolean => {
  const key = getAgentNodeKey(workspaceRootPath, agentDefinitionId);
  return expandedAgents.value[key] ?? true;
};

const toggleWorkspace = (workspaceRootPath: string): void => {
  const next = !isWorkspaceExpanded(workspaceRootPath);
  expandedWorkspace.value = {
    ...expandedWorkspace.value,
    [workspaceRootPath]: next,
  };
};

const toggleAgent = (workspaceRootPath: string, agentDefinitionId: string): void => {
  const key = getAgentNodeKey(workspaceRootPath, agentDefinitionId);
  const next = !isAgentExpanded(workspaceRootPath, agentDefinitionId);
  expandedAgents.value = {
    ...expandedAgents.value,
    [key]: next,
  };
};

const onSelectRun = async (run: RunTreeRow): Promise<void> => {
  try {
    await runHistoryStore.selectTreeRun(run);
    emit('instance-selected', { type: 'agent', instanceId: run.runId });
  } catch (error) {
    console.error('Failed to open run:', error);
  }
};

const onTerminateRun = async (runId: string): Promise<void> => {
  const terminateErrorMessage = 'Failed to terminate run. Please try again.';
  if (terminatingRunIds.value[runId]) {
    return;
  }

  terminatingRunIds.value = {
    ...terminatingRunIds.value,
    [runId]: true,
  };

  try {
    const terminated = await agentRunStore.terminateRun(runId);
    if (!terminated) {
      console.error(`Failed to terminate run '${runId}'.`);
      addToast(terminateErrorMessage, 'error');
    }
  } catch (error) {
    console.error('Failed to terminate run:', error);
    addToast(terminateErrorMessage, 'error');
  } finally {
    const next = { ...terminatingRunIds.value };
    delete next[runId];
    terminatingRunIds.value = next;
  }
};

const onDeleteRun = async (run: RunTreeRow): Promise<void> => {
  if (run.source !== 'history' || run.isActive) {
    return;
  }

  const runId = run.runId;
  if (deletingRunIds.value[runId]) {
    return;
  }

  pendingDeleteRunId.value = runId;
  showDeleteConfirmation.value = true;
};

const closeDeleteConfirmation = (): void => {
  showDeleteConfirmation.value = false;
  pendingDeleteRunId.value = null;
};

const confirmDeleteRun = async (): Promise<void> => {
  const deleteErrorMessage = 'Failed to delete run. Please try again.';
  const runId = pendingDeleteRunId.value;
  closeDeleteConfirmation();
  if (!runId || deletingRunIds.value[runId]) {
    return;
  }

  deletingRunIds.value = {
    ...deletingRunIds.value,
    [runId]: true,
  };

  try {
    const deleted = await runHistoryStore.deleteRun(runId);
    if (!deleted) {
      addToast(deleteErrorMessage, 'error');
      return;
    }
    addToast('Run deleted permanently.', 'success');
  } catch (error) {
    console.error('Failed to delete run:', error);
    addToast(deleteErrorMessage, 'error');
  } finally {
    const next = { ...deletingRunIds.value };
    delete next[runId];
    deletingRunIds.value = next;
  }
};

const onCreateRun = async (workspaceRootPath: string, agentDefinitionId: string): Promise<void> => {
  try {
    await runHistoryStore.createDraftRun({ workspaceRootPath, agentDefinitionId });
    emit('instance-created', { type: 'agent', definitionId: agentDefinitionId });
  } catch (error) {
    console.error('Failed to create draft run:', error);
  }
};

const focusWorkspaceInput = async (): Promise<void> => {
  await nextTick();
  workspacePathInputRef.value?.focus();
};

const onCreateWorkspace = async (): Promise<void> => {
  if (showCreateWorkspaceInline.value) {
    closeCreateWorkspaceInput();
    return;
  }
  workspacePathError.value = '';
  workspacePathDraft.value = '';
  showCreateWorkspaceInline.value = true;
  await focusWorkspaceInput();
};

const resetCreateWorkspaceInline = (): void => {
  showCreateWorkspaceInline.value = false;
  workspacePathDraft.value = '';
  workspacePathError.value = '';
};

const closeCreateWorkspaceInput = (): void => {
  if (creatingWorkspace.value) {
    return;
  }
  resetCreateWorkspaceInline();
};

const confirmCreateWorkspace = async (): Promise<void> => {
  const rootPath = workspacePathDraft.value.trim();
  if (!rootPath) {
    workspacePathError.value = 'Workspace path is required.';
    await focusWorkspaceInput();
    return;
  }

  try {
    creatingWorkspace.value = true;
    workspacePathError.value = '';
    const normalizedRootPath = await runHistoryStore.createWorkspace(rootPath);
    expandedWorkspace.value = {
      ...expandedWorkspace.value,
      [normalizedRootPath]: true,
    };
    await workspaceStore.fetchAllWorkspaces();
    resetCreateWorkspaceInline();
  } catch (error) {
    console.error('Failed to add workspace:', error);
    workspacePathError.value = 'Failed to add workspace. Please verify the path and try again.';
    await focusWorkspaceInput();
  } finally {
    creatingWorkspace.value = false;
  }
};

onMounted(async () => {
  await Promise.all([
    workspaceStore.fetchAllWorkspaces().catch(() => undefined),
    runHistoryStore.fetchTree(),
  ]);
});
</script>
