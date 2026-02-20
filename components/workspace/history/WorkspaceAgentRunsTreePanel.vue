<template>
  <div class="flex h-full flex-col bg-white">
    <div class="flex items-center justify-between border-t border-gray-200 px-3 py-2">
      <h3 class="text-sm font-semibold text-gray-700">Workspaces</h3>
      <button
        type="button"
        class="inline-flex h-6 w-6 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
        title="Add workspace"
        @click="actions.startWorkspaceCreationFlow"
      >
        <Icon icon="heroicons:plus-20-solid" class="h-4 w-4" />
      </button>
    </div>

    <WorkspaceCreateInlineForm
      v-if="actions.showCreateWorkspaceInline.value"
      v-model="actions.workspacePathDraft.value"
      :error-message="actions.workspacePathError.value"
      :creating-workspace="actions.creatingWorkspace.value"
      @confirm="actions.confirmCreateWorkspace"
      @cancel="actions.closeCreateWorkspaceInput"
    />

    <div class="min-h-0 flex-1 overflow-y-auto px-1 pb-2">
      <div v-if="runTreeStore.loading" class="px-3 py-4 text-xs text-gray-500">
        Loading task history...
      </div>

      <div v-else-if="runTreeStore.error" class="px-3 py-4 text-xs text-red-600">
        {{ runTreeStore.error }}
      </div>

      <div
        v-else-if="workspaceNodes.length === 0"
        class="px-3 py-4 text-xs text-gray-500"
      >
        No run history yet.
      </div>

      <div v-else class="space-y-1">
        <WorkspaceRunsSection
          :workspace-nodes="workspaceNodes"
          :selected-agent-id="selectedAgentId"
          :selected-team-id="selectedTeamId"
          :selected-team-member-route-key="selectedTeamMemberRouteKey"
          :expanded-workspace="viewState.expandedWorkspace.value"
          :expanded-agents="viewState.expandedAgents.value"
          :expanded-teams="viewState.expandedTeams.value"
          :terminating-agent-ids="actions.terminatingAgentIds.value"
          :terminating-team-ids="actions.terminatingTeamIds.value"
          :deleting-agent-ids="actions.deletingAgentIds.value"
          :deleting-team-ids="actions.deletingTeamIds.value"
          :show-agent-avatar="viewState.showAgentAvatar"
          :format-relative-time="runTreeStore.formatRelativeTime"
          @toggle-workspace="viewState.toggleWorkspace"
          @toggle-agent="viewState.toggleAgent"
          @toggle-team="viewState.toggleTeam"
          @select-run="actions.selectRun"
          @select-member="actions.selectTeamMember"
          @create-run="actions.createDraftRun"
          @terminate-run="actions.terminateRun"
          @terminate-team="actions.terminateTeam"
          @delete-run="actions.requestDeleteRun"
          @delete-team="actions.requestDeleteTeam"
          @avatar-error="viewState.markAvatarBroken"
        />
      </div>
    </div>

    <ConfirmationModal
      :show="actions.showDeleteConfirmation.value"
      title=""
      message="Delete this history permanently. This cannot be undone."
      confirm-button-text="Delete"
      variant="danger"
      typography-size="large"
      @confirm="actions.confirmDelete"
      @cancel="actions.closeDeleteConfirmation"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { Icon } from '@iconify/vue';
import ConfirmationModal from '~/components/common/ConfirmationModal.vue';
import WorkspaceCreateInlineForm from '~/components/workspace/history/WorkspaceCreateInlineForm.vue';
import WorkspaceRunsSection from '~/components/workspace/history/WorkspaceRunsSection.vue';
import { useRunTreeStore } from '~/stores/runTreeStore';
import { useAgentSelectionStore } from '~/stores/agentSelectionStore';
import { useAgentTeamContextsStore } from '~/stores/agentTeamContextsStore';
import { useWindowNodeContextStore } from '~/stores/windowNodeContextStore';
import { useToasts } from '~/composables/useToasts';
import { useRunTreeActions } from '~/composables/workspace/history/useRunTreeActions';
import { useRunTreeViewState } from '~/composables/workspace/history/useRunTreeViewState';

const emit = defineEmits<{
  (e: 'instance-selected', payload: { type: 'agent'; instanceId: string }): void;
  (e: 'instance-selected', payload: { type: 'team'; instanceId: string }): void;
  (e: 'instance-created', payload: { type: 'agent'; definitionId: string }): void;
}>();

const runTreeStore = useRunTreeStore();
const selectionStore = useAgentSelectionStore();
const teamContextsStore = useAgentTeamContextsStore();
const windowNodeContextStore = useWindowNodeContextStore();
const { isEmbeddedWindow } = storeToRefs(windowNodeContextStore);
const { addToast } = useToasts();

const viewState = useRunTreeViewState();
const actions = useRunTreeActions({
  isEmbeddedWindow,
  addToast,
  onAgentSelected: (agentId) => {
    emit('instance-selected', { type: 'agent', instanceId: agentId });
  },
  onTeamSelected: (teamId) => {
    emit('instance-selected', { type: 'team', instanceId: teamId });
  },
  onAgentCreated: (definitionId) => {
    emit('instance-created', { type: 'agent', definitionId });
  },
  onWorkspaceCreated: (workspaceRootPath) => {
    viewState.expandWorkspace(workspaceRootPath);
  },
});

const workspaceNodes = computed(() => {
  return runTreeStore.getTreeNodes();
});

const selectedAgentId = computed(() => {
  if (selectionStore.selectedType === 'agent' && selectionStore.selectedInstanceId) {
    return selectionStore.selectedInstanceId;
  }
  return runTreeStore.selectedAgentId;
});

const selectedTeamId = computed(() => {
  if (selectionStore.selectedType === 'team' && selectionStore.selectedInstanceId) {
    return selectionStore.selectedInstanceId;
  }
  return runTreeStore.selectedTeamId;
});

const selectedTeamMemberRouteKey = computed(() => {
  const selectedTeam = selectedTeamId.value;
  if (!selectedTeam) {
    return null;
  }

  const activeTeam = teamContextsStore.getTeamContextById(selectedTeam);
  if (activeTeam?.focusedMemberName) {
    return activeTeam.focusedMemberName;
  }

  return runTreeStore.selectedTeamMemberRouteKey;
});

watch(
  () => runTreeStore.loading,
  (loading, previousLoading) => {
    if (previousLoading && !loading) {
      viewState.resetBrokenAvatars();
    }
  },
);

onMounted(async () => {
  await actions.initializePanelData();
});
</script>
