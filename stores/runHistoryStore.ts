import { defineStore } from 'pinia';
import { getApolloClient } from '~/utils/apolloClient';
import { useWindowNodeContextStore } from '~/stores/windowNodeContextStore';
import { useWorkspaceStore } from '~/stores/workspace';
import { useAgentDefinitionStore } from '~/stores/agentDefinitionStore';
import { useAgentContextsStore } from '~/stores/agentContextsStore';
import { useAgentSelectionStore } from '~/stores/agentSelectionStore';
import { useAgentRunConfigStore } from '~/stores/agentRunConfigStore';
import { useTeamRunConfigStore } from '~/stores/teamRunConfigStore';
import { useLLMProviderConfigStore } from '~/stores/llmProviderConfig';
import { ListRunHistory } from '~/graphql/queries/runHistoryQueries';
import { DeleteRunHistory } from '~/graphql/mutations/runHistoryMutations';
import type { SkillAccessMode } from '~/types/agent/AgentRunConfig';
import type { Conversation } from '~/types/conversation';
import { AgentStatus } from '~/types/agent/AgentStatus';
import {
  buildRunTreeProjection,
  type DraftRunSnapshot,
  type RunTreeRow,
  type RunTreeWorkspaceNode,
} from '~/utils/runTreeProjection';
import { mergeRunTreeWithLiveContexts } from '~/utils/runTreeLiveStatusMerge';
import {
  DEFAULT_DRAFT_SUMMARY_PREFIX,
  DRAFT_RUN_ID_PREFIX,
} from '~/utils/runTreeProjectionConstants';
import {
  pickPreferredRunTemplate,
  resolveRunnableModelIdentifier,
} from '~/utils/runLaunchPolicy';
import { openRunWithCoordinator } from '~/services/runOpen/runOpenCoordinator';

export type RunKnownStatus = 'ACTIVE' | 'IDLE' | 'ERROR';

export interface RunHistoryItem {
  runId: string;
  summary: string;
  lastActivityAt: string;
  lastKnownStatus: RunKnownStatus;
  isActive: boolean;
}

export interface RunHistoryAgentGroup {
  agentDefinitionId: string;
  agentName: string;
  agentAvatarUrl?: string | null;
  runs: RunHistoryItem[];
}

export interface RunHistoryWorkspaceGroup {
  workspaceRootPath: string;
  workspaceName: string;
  agents: RunHistoryAgentGroup[];
}

export interface RunEditableFieldFlags {
  llmModelIdentifier: boolean;
  llmConfig: boolean;
  autoExecuteTools: boolean;
  skillAccessMode: boolean;
  workspaceRootPath: boolean;
}

export interface RunManifestConfigPayload {
  agentDefinitionId: string;
  workspaceRootPath: string;
  llmModelIdentifier: string;
  llmConfig?: Record<string, unknown> | null;
  autoExecuteTools: boolean;
  skillAccessMode?: SkillAccessMode | null;
}

export interface RunResumeConfigPayload {
  runId: string;
  isActive: boolean;
  manifestConfig: RunManifestConfigPayload;
  editableFields: RunEditableFieldFlags;
}

interface ListRunHistoryQueryData {
  listRunHistory: RunHistoryWorkspaceGroup[];
}

interface DeleteRunHistoryMutationData {
  deleteRunHistory: {
    success: boolean;
    message: string;
  };
}

const FALSE_EDITABLE_FIELDS: RunEditableFieldFlags = {
  llmModelIdentifier: false,
  llmConfig: false,
  autoExecuteTools: false,
  skillAccessMode: false,
  workspaceRootPath: false,
};

const normalizeRootPath = (value: string | null | undefined): string => {
  const source = (value || '').trim();
  if (!source) {
    return '';
  }
  const normalized = source.replace(/\\/g, '/');
  if (normalized === '/') {
    return normalized;
  }
  return normalized.replace(/\/+$/, '');
};

const displayWorkspaceName = (workspaceRootPath: string): string => {
  const normalized = normalizeRootPath(workspaceRootPath);
  if (!normalized) {
    return 'workspace';
  }
  const parts = normalized.split('/').filter(Boolean);
  return parts[parts.length - 1] || normalized;
};

const resolveWorkspaceRootPath = (
  workspaceStore: ReturnType<typeof useWorkspaceStore>,
  workspaceId: string | null,
): string => {
  if (!workspaceId) {
    return '';
  }

  const workspace = workspaceStore.workspaces[workspaceId];
  if (!workspace) {
    return '';
  }

  return normalizeRootPath(
    workspace.absolutePath ||
      workspace.workspaceConfig?.root_path ||
      workspace.workspaceConfig?.rootPath ||
      null,
  );
};

const summarizeDraftRun = (
  conversation: Conversation,
  agentName: string,
): string => {
  const firstUserMessage = conversation.messages.find(
    message => message.type === 'user' && message.text?.trim().length > 0,
  );
  if (firstUserMessage?.type === 'user') {
    return firstUserMessage.text.trim();
  }
  return `${DEFAULT_DRAFT_SUMMARY_PREFIX}${agentName}`.trim();
};

const removeRunFromWorkspaceGroups = (
  groups: RunHistoryWorkspaceGroup[],
  runId: string,
): RunHistoryWorkspaceGroup[] => {
  return groups
    .map((workspace) => ({
      ...workspace,
      agents: workspace.agents
        .map((agent) => ({
          ...agent,
          runs: agent.runs.filter((run) => run.runId !== runId),
        }))
        .filter((agent) => agent.runs.length > 0),
    }))
    .filter((workspace) => workspace.agents.length > 0);
};

const toRunStatus = (status: AgentStatus): Pick<RunHistoryItem, 'isActive' | 'lastKnownStatus'> => {
  if (status === AgentStatus.Error) {
    return { isActive: false, lastKnownStatus: 'ERROR' };
  }

  if (
    status === AgentStatus.Uninitialized ||
    status === AgentStatus.Idle ||
    status === AgentStatus.ShutdownComplete ||
    status === AgentStatus.ToolDenied
  ) {
    return { isActive: false, lastKnownStatus: 'IDLE' };
  }

  return { isActive: true, lastKnownStatus: 'ACTIVE' };
};

export const useRunHistoryStore = defineStore('runHistory', {
  state: () => ({
    workspaceGroups: [] as RunHistoryWorkspaceGroup[],
    agentAvatarByDefinitionId: {} as Record<string, string>,
    resumeConfigByRunId: {} as Record<string, RunResumeConfigPayload>,
    selectedRunId: null as string | null,
    loading: false,
    openingRun: false,
    error: null as string | null,
  }),

  getters: {
    getResumeConfig: (state) => (runId: string): RunResumeConfigPayload | null => {
      return state.resumeConfigByRunId[runId] || null;
    },

    getEditableFields: (state) => (runId: string): RunEditableFieldFlags | null => {
      return state.resumeConfigByRunId[runId]?.editableFields || null;
    },

    isRunActive: (state) => (runId: string): boolean => {
      return Boolean(state.resumeConfigByRunId[runId]?.isActive);
    },

    isWorkspaceLockedForRun: (state) => (runId: string): boolean => {
      const editable = state.resumeConfigByRunId[runId]?.editableFields;
      if (!editable) {
        return false;
      }
      return !editable.workspaceRootPath;
    },
  },

  actions: {
    async fetchTree(limitPerAgent = 6): Promise<void> {
      this.loading = true;
      this.error = null;

      try {
        const windowNodeContextStore = useWindowNodeContextStore();
        const isReady = await windowNodeContextStore.waitForBoundBackendReady();
        if (!isReady) {
          throw new Error(windowNodeContextStore.lastReadyError || 'Bound backend is not ready');
        }

        const client = getApolloClient();
        const { data, errors } = await client.query<ListRunHistoryQueryData>({
          query: ListRunHistory,
          variables: { limitPerAgent },
          fetchPolicy: 'network-only',
        });

        if (errors && errors.length > 0) {
          throw new Error(errors.map((e: { message: string }) => e.message).join(', '));
        }

        this.workspaceGroups = data?.listRunHistory || [];
        await this.refreshAgentAvatarIndex({ loadDefinitionsIfNeeded: true });
      } catch (error: any) {
        this.error = error?.message || 'Failed to load run history.';
      } finally {
        this.loading = false;
      }
    },

    async refreshAgentAvatarIndex(options: { loadDefinitionsIfNeeded?: boolean } = {}): Promise<void> {
      const agentDefinitionStore = useAgentDefinitionStore();
      const agentContextsStore = useAgentContextsStore();
      const shouldLoadDefinitions = options.loadDefinitionsIfNeeded ?? false;

      if (shouldLoadDefinitions && agentDefinitionStore.agentDefinitions.length === 0) {
        try {
          await agentDefinitionStore.fetchAllAgentDefinitions();
        } catch {
          // Best-effort hydration only.
        }
      }

      const next: Record<string, string> = { ...this.agentAvatarByDefinitionId };

      for (const definition of agentDefinitionStore.agentDefinitions) {
        const avatarUrl = definition.avatarUrl?.trim();
        if (avatarUrl) {
          next[definition.id] = avatarUrl;
        }
      }

      for (const context of agentContextsStore.instances.values()) {
        const definitionId = context.config.agentDefinitionId;
        const avatarUrl = context.config.agentAvatarUrl?.trim();
        if (definitionId && avatarUrl) {
          next[definitionId] = avatarUrl;
        }
      }

      this.agentAvatarByDefinitionId = next;
    },

    async openRun(runId: string): Promise<void> {
      this.openingRun = true;
      this.error = null;

      try {
        const result = await openRunWithCoordinator({
          runId,
          fallbackAgentName: this.findAgentNameByRunId(runId),
          ensureWorkspaceByRootPath: (rootPath: string) => this.ensureWorkspaceByRootPath(rootPath),
        });

        this.resumeConfigByRunId[runId] = result.resumeConfig;
        this.selectedRunId = result.runId;
      } catch (error: any) {
        this.error = error?.message || `Failed to open run '${runId}'.`;
        throw error;
      } finally {
        this.openingRun = false;
      }
    },

    async createDraftRun(options: {
      workspaceRootPath: string;
      agentDefinitionId: string;
    }): Promise<string> {
      const agentDefinitionStore = useAgentDefinitionStore();
      if (agentDefinitionStore.agentDefinitions.length === 0) {
        await agentDefinitionStore.fetchAllAgentDefinitions();
      }

      const definition = agentDefinitionStore.getAgentDefinitionById(options.agentDefinitionId);
      if (!definition) {
        throw new Error(`Agent definition '${options.agentDefinitionId}' was not found.`);
      }

      const workspaceId = await this.ensureWorkspaceByRootPath(options.workspaceRootPath);
      if (!workspaceId) {
        throw new Error(`Workspace '${options.workspaceRootPath}' could not be resolved.`);
      }

      const agentRunConfigStore = useAgentRunConfigStore();
      const llmProviderConfigStore = useLLMProviderConfigStore();
      const teamRunConfigStore = useTeamRunConfigStore();
      const selectionStore = useAgentSelectionStore();
      const agentContextsStore = useAgentContextsStore();

      const templateCandidates = Array.from(agentContextsStore.instances.values()).filter(
        (context) => context.config.agentDefinitionId === options.agentDefinitionId,
      );
      const preferredTemplate = pickPreferredRunTemplate(templateCandidates, workspaceId);

      const bufferedModelCandidate =
        agentRunConfigStore.config?.agentDefinitionId === options.agentDefinitionId
          ? agentRunConfigStore.config.llmModelIdentifier
          : '';
      const resolvedModelIdentifier = await resolveRunnableModelIdentifier({
        candidateModels: [
          preferredTemplate?.config.llmModelIdentifier,
          bufferedModelCandidate,
        ],
        getKnownModels: () => llmProviderConfigStore.models,
        ensureModelsLoaded: async () => {
          if (llmProviderConfigStore.models.length === 0) {
            await llmProviderConfigStore.fetchProvidersWithModels();
          }
        },
      });

      if (!resolvedModelIdentifier) {
        throw new Error('No model is available to start a new run.');
      }

      teamRunConfigStore.clearConfig();
      if (preferredTemplate) {
        agentRunConfigStore.setAgentConfig({
          ...preferredTemplate.config,
          agentDefinitionId: definition.id,
          agentDefinitionName: definition.name,
          agentAvatarUrl: definition.avatarUrl ?? preferredTemplate.config.agentAvatarUrl ?? null,
          workspaceId,
          llmModelIdentifier: resolvedModelIdentifier,
          isLocked: false,
        });
      } else {
        agentRunConfigStore.setTemplate(definition);
        agentRunConfigStore.updateAgentConfig({
          workspaceId,
          llmModelIdentifier: resolvedModelIdentifier,
        });
      }

      selectionStore.clearSelection();

      const tempRunId = agentContextsStore.createInstanceFromTemplate();
      this.selectedRunId = tempRunId;

      return tempRunId;
    },

    async createWorkspace(rootPath: string): Promise<string> {
      const workspaceStore = useWorkspaceStore();
      const workspaceId = await workspaceStore.createWorkspace({ root_path: rootPath });
      const workspace = workspaceStore.workspaces[workspaceId];
      return workspace?.absolutePath || rootPath;
    },

    markRunAsActive(runId: string): void {
      const resumeConfig = this.resumeConfigByRunId[runId];
      if (resumeConfig) {
        this.resumeConfigByRunId[runId] = {
          ...resumeConfig,
          isActive: true,
          editableFields: { ...FALSE_EDITABLE_FIELDS },
        };
      }

      const now = new Date().toISOString();
      this.workspaceGroups = this.workspaceGroups.map((workspace) => ({
        ...workspace,
        agents: workspace.agents.map((agent) => ({
          ...agent,
          runs: agent.runs.map((run) =>
            run.runId === runId
              ? {
                  ...run,
                  isActive: true,
                  lastKnownStatus: 'ACTIVE',
                  lastActivityAt: now,
                }
              : run,
          ),
        })),
      }));
    },

    markRunAsInactive(runId: string): void {
      const resumeConfig = this.resumeConfigByRunId[runId];
      if (resumeConfig) {
        this.resumeConfigByRunId[runId] = {
          ...resumeConfig,
          isActive: false,
          editableFields: {
            llmModelIdentifier: true,
            llmConfig: true,
            autoExecuteTools: true,
            skillAccessMode: true,
            workspaceRootPath: false,
          },
        };
      }

      const now = new Date().toISOString();
      this.workspaceGroups = this.workspaceGroups.map((workspace) => ({
        ...workspace,
        agents: workspace.agents.map((agent) => ({
          ...agent,
          runs: agent.runs.map((run) =>
            run.runId === runId
              ? {
                  ...run,
                  isActive: false,
                  lastKnownStatus: run.lastKnownStatus === 'ERROR' ? 'ERROR' : 'IDLE',
                  lastActivityAt: now,
                }
              : run,
          ),
        })),
      }));
    },

    async deleteRun(runId: string): Promise<boolean> {
      const normalizedRunId = runId.trim();
      if (!normalizedRunId || normalizedRunId.startsWith(DRAFT_RUN_ID_PREFIX)) {
        return false;
      }

      try {
        const client = getApolloClient();
        const { data, errors } = await client.mutate<DeleteRunHistoryMutationData>({
          mutation: DeleteRunHistory,
          variables: { runId: normalizedRunId },
        });

        if (errors && errors.length > 0) {
          throw new Error(errors.map((e: { message: string }) => e.message).join(', '));
        }

        const result = data?.deleteRunHistory;
        if (!result?.success) {
          return false;
        }

        const nextResumeConfigs = { ...this.resumeConfigByRunId };
        delete nextResumeConfigs[normalizedRunId];
        this.resumeConfigByRunId = nextResumeConfigs;
        this.workspaceGroups = removeRunFromWorkspaceGroups(this.workspaceGroups, normalizedRunId);

        const agentContextsStore = useAgentContextsStore();
        const hadContext = Boolean(agentContextsStore.getInstance(normalizedRunId));
        if (hadContext) {
          agentContextsStore.removeInstance(normalizedRunId);
        }

        const selectionStore = useAgentSelectionStore();
        const selectedBySelectionStore =
          selectionStore.selectedType === 'agent' &&
          selectionStore.selectedInstanceId === normalizedRunId;
        if (selectedBySelectionStore && !hadContext) {
          selectionStore.clearSelection();
        }

        if (this.selectedRunId === normalizedRunId) {
          this.selectedRunId = null;
        }

        await this.refreshTreeQuietly();
        return true;
      } catch (error: any) {
        console.error(`Failed to delete run '${normalizedRunId}':`, error);
        return false;
      }
    },

    async refreshTreeQuietly(limitPerAgent = 6): Promise<void> {
      try {
        await this.fetchTree(limitPerAgent);
      } catch {
        // No-op for best-effort refreshes.
      }
    },

    getTreeNodes(): RunTreeWorkspaceNode[] {
      const workspaceStore = useWorkspaceStore();
      const agentContextsStore = useAgentContextsStore();
      const workspaceDescriptors = new Map<string, string>();
      const agentAvatarByDefinitionId = new Map<string, string>(
        Object.entries(this.agentAvatarByDefinitionId),
      );

      for (const context of agentContextsStore.instances.values()) {
        const definitionId = context.config.agentDefinitionId;
        const avatarUrl = context.config.agentAvatarUrl?.trim();
        if (definitionId && avatarUrl) {
          agentAvatarByDefinitionId.set(definitionId, avatarUrl);
        }
      }

      for (const group of this.workspaceGroups) {
        const normalizedRoot = normalizeRootPath(group.workspaceRootPath);
        if (!normalizedRoot) {
          continue;
        }
        workspaceDescriptors.set(
          normalizedRoot,
          group.workspaceName || displayWorkspaceName(normalizedRoot),
        );
      }

      for (const workspace of workspaceStore.allWorkspaces) {
        const normalizedRoot = normalizeRootPath(workspace.absolutePath || null);
        if (!normalizedRoot) {
          continue;
        }
        if (!workspaceDescriptors.has(normalizedRoot)) {
          workspaceDescriptors.set(
            normalizedRoot,
            workspace.name || displayWorkspaceName(normalizedRoot),
          );
        }
      }

      const persistedWorkspaces: RunHistoryWorkspaceGroup[] = this.workspaceGroups.map((workspace) => ({
        ...workspace,
        agents: workspace.agents.map((agent) => ({
          ...agent,
          agentAvatarUrl:
            agent.agentAvatarUrl ??
            agentAvatarByDefinitionId.get(agent.agentDefinitionId) ??
            null,
        })),
      }));

      const draftRuns: DraftRunSnapshot[] = [];
      for (const [runId, context] of agentContextsStore.instances.entries()) {
        if (!runId.startsWith(DRAFT_RUN_ID_PREFIX)) {
          continue;
        }

        const workspaceRootPath = resolveWorkspaceRootPath(
          workspaceStore,
          context.config.workspaceId,
        );
        if (!workspaceRootPath) {
          continue;
        }

        const agentName = context.config.agentDefinitionName || 'Agent';
        const conversation = context.state.conversation;
        const { isActive, lastKnownStatus } = toRunStatus(context.state.currentStatus);
        const agentAvatarUrl =
          context.config.agentAvatarUrl?.trim() ||
          agentAvatarByDefinitionId.get(context.config.agentDefinitionId) ||
          null;

        draftRuns.push({
          runId,
          workspaceRootPath,
          agentDefinitionId: context.config.agentDefinitionId,
          agentName,
          agentAvatarUrl,
          summary: summarizeDraftRun(conversation, agentName),
          lastActivityAt:
            conversation.updatedAt ||
            conversation.createdAt ||
            new Date().toISOString(),
          lastKnownStatus,
          isActive,
        });
      }

      const projectedTree = buildRunTreeProjection({
        persistedWorkspaces,
        workspaceDescriptors: Array.from(workspaceDescriptors.entries()).map(
          ([workspaceRootPath, workspaceName]) => ({
            workspaceRootPath,
            workspaceName,
          }),
        ),
        draftRuns,
      });

      return mergeRunTreeWithLiveContexts(projectedTree, agentContextsStore.instances);
    },

    async selectTreeRun(row: RunTreeRow): Promise<void> {
      if (row.source === 'history') {
        await this.openRun(row.runId);
        return;
      }

      const contextsStore = useAgentContextsStore();
      const context = contextsStore.getInstance(row.runId);
      if (!context) {
        return;
      }

      const selectionStore = useAgentSelectionStore();
      selectionStore.selectInstance(row.runId, 'agent');
      this.selectedRunId = row.runId;
      useTeamRunConfigStore().clearConfig();
      useAgentRunConfigStore().clearConfig();
    },

    formatRelativeTime(isoTime: string): string {
      const time = Date.parse(isoTime);
      if (!Number.isFinite(time)) {
        return '';
      }

      const deltaMs = Date.now() - time;
      if (deltaMs < 60_000) {
        return 'now';
      }

      const minutes = Math.floor(deltaMs / 60_000);
      if (minutes < 60) {
        return `${minutes}m`;
      }

      const hours = Math.floor(minutes / 60);
      if (hours < 24) {
        return `${hours}h`;
      }

      const days = Math.floor(hours / 24);
      if (days < 7) {
        return `${days}d`;
      }

      const weeks = Math.floor(days / 7);
      return `${weeks}w`;
    },

    async ensureWorkspaceByRootPath(rootPath: string): Promise<string | null> {
      const workspaceStore = useWorkspaceStore();
      if (!rootPath.trim()) {
        return null;
      }

      if (!workspaceStore.workspacesFetched) {
        try {
          await workspaceStore.fetchAllWorkspaces();
        } catch {
          // Fallback to direct creation below.
        }
      }

      try {
        const normalizedRootPath = normalizeRootPath(rootPath) || rootPath.trim();
        return await workspaceStore.createWorkspace({ root_path: normalizedRootPath });
      } catch {
        return null;
      }
    },

    findAgentNameByRunId(runId: string): string | null {
      for (const workspace of this.workspaceGroups) {
        for (const agent of workspace.agents) {
          if (agent.runs.some(run => run.runId === runId)) {
            return agent.agentName;
          }
        }
      }
      return null;
    },
  },
});
