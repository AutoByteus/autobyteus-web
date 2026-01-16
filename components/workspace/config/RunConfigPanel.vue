<template>
  <div class="flex flex-col h-full bg-white">
    <!-- Header Removed -->

    <div class="flex-1 overflow-y-auto px-4 py-4">
        <!-- Placeholder if nothing selected -->
        <div v-if="!effectiveAgentConfig && !effectiveTeamConfig" class="h-full flex flex-col items-center justify-center text-center text-gray-500">
            <span class="i-heroicons-cursor-arrow-rays-20-solid w-12 h-12 mb-2 text-gray-300"></span>
            <p>Select an agent or team to configure or run.</p>
        </div>

        <!-- Agent Form -->
        <AgentRunConfigForm
           v-else-if="effectiveAgentConfig && activeAgentDefinition"
           :config="effectiveAgentConfig"
           :agent-definition="activeAgentDefinition"
           :workspace-loading-state="effectiveWorkspaceLoadingState"
           :initial-path="initialWorkspacePath"
           @select-existing="handleSelectExisting"
           @load-new="handleLoadNew"
        />

        <!-- Team Form -->
        <TeamRunConfigForm
           v-else-if="effectiveTeamConfig && activeTeamDefinition"
           :config="effectiveTeamConfig"
           :team-definition="activeTeamDefinition"
           :workspace-loading-state="effectiveWorkspaceLoadingState"
           :initial-path="initialWorkspacePath"
           @select-existing="handleSelectExisting"
           @load-new="handleLoadNew"
        />

        <div v-else class="text-center text-red-500 mt-4">
            Error: Definition not found.
        </div>
    </div>

    <!-- Actions Footer -->
    <div v-if="!isSelectionMode && ((effectiveAgentConfig && activeAgentDefinition) || (effectiveTeamConfig && activeTeamDefinition))" class="px-4 py-3 border-t border-gray-200 bg-gray-50">
        <button
            @click="handleRun"
            :disabled="isRunDisabled"
            class="run-btn w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <span>Run {{ isTeamActive ? 'Team' : 'Agent' }}</span>
        </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAgentSelectionStore } from '~/stores/agentSelectionStore';
import { useAgentRunConfigStore } from '~/stores/agentRunConfigStore';
import { useTeamRunConfigStore } from '~/stores/teamRunConfigStore';
import { useAgentContextsStore } from '~/stores/agentContextsStore';
import { useAgentTeamContextsStore } from '~/stores/agentTeamContextsStore';
import { useAgentDefinitionStore } from '~/stores/agentDefinitionStore';
import { useAgentTeamDefinitionStore } from '~/stores/agentTeamDefinitionStore';
import { useWorkspaceStore } from '~/stores/workspace';
import { useRightSideTabs } from '~/composables/useRightSideTabs';
import AgentRunConfigForm from './AgentRunConfigForm.vue';
import TeamRunConfigForm from './TeamRunConfigForm.vue';
import type { AgentRunConfig } from '~/types/agent/AgentRunConfig';
import type { TeamRunConfig } from '~/types/agent/TeamRunConfig';

const selectionStore = useAgentSelectionStore();
const runConfigStore = useAgentRunConfigStore();
const teamRunConfigStore = useTeamRunConfigStore();
const contextsStore = useAgentContextsStore();
const teamContextsStore = useAgentTeamContextsStore();
const definitionStore = useAgentDefinitionStore();
const teamDefinitionStore = useAgentTeamDefinitionStore();
const workspaceStore = useWorkspaceStore();
const { setActiveTab } = useRightSideTabs();

// Mode Detection
const isSelectionMode = computed(() => !!selectionStore.selectedInstanceId);

// Effective Agent Config
const effectiveAgentConfig = computed((): AgentRunConfig | null => {
    if (selectionStore.isAgentSelected && selectionStore.selectedInstanceId) {
        return contextsStore.activeInstance?.config || null;
    }
    if (!isSelectionMode.value && runConfigStore.config?.agentDefinitionId) {
        return runConfigStore.config;
    }
    return null;
});

// Effective Team Config
const effectiveTeamConfig = computed((): TeamRunConfig | null => {
    if (selectionStore.isTeamSelected && selectionStore.selectedInstanceId) {
        return teamContextsStore.activeTeamContext?.config || null;
    }
    if (!isSelectionMode.value && teamRunConfigStore.config?.teamDefinitionId) {
        return teamRunConfigStore.config;
    }
    return null;
});

const isTeamActive = computed(() => !!effectiveTeamConfig.value);

// Definitions
const activeAgentDefinition = computed(() => {
    if (!effectiveAgentConfig.value?.agentDefinitionId) return null;
    return definitionStore.getAgentDefinitionById(effectiveAgentConfig.value.agentDefinitionId) || null;
});

const activeTeamDefinition = computed(() => {
    if (!effectiveTeamConfig.value?.teamDefinitionId) return null;
    return teamDefinitionStore.getAgentTeamDefinitionById(effectiveTeamConfig.value.teamDefinitionId) || null;
});

// Title
const configTitle = computed(() => {
    if (effectiveAgentConfig.value) return isSelectionMode.value ? 'Agent Configuration' : 'New Agent Configuration';
    if (effectiveTeamConfig.value) return isSelectionMode.value ? 'Team Configuration' : 'New Team Configuration';
    return 'Configuration';
});

const resolveWorkspacePath = (workspaceId: string | null): string => {
    if (!workspaceId) return '';
    const workspace = workspaceStore.workspaces[workspaceId];
    return workspace?.absolutePath || workspace?.workspaceConfig?.root_path || workspace?.workspaceConfig?.rootPath || '';
};

// Workspace State
const effectiveWorkspaceLoadingState = computed(() => {
    if (isSelectionMode.value) {
        const workspaceId = effectiveTeamConfig.value?.workspaceId || effectiveAgentConfig.value?.workspaceId || null;
        return { isLoading: false, error: null, loadedPath: resolveWorkspacePath(workspaceId) || null };
    }
    if (effectiveTeamConfig.value) {
        const base = teamRunConfigStore.workspaceLoadingState;
        const fallbackPath = resolveWorkspacePath(effectiveTeamConfig.value.workspaceId);
        return {
            ...base,
            loadedPath: base.loadedPath || fallbackPath || null,
        };
    }
    if (effectiveAgentConfig.value) {
        const base = runConfigStore.workspaceLoadingState;
        const fallbackPath = resolveWorkspacePath(effectiveAgentConfig.value.workspaceId);
        return {
            ...base,
            loadedPath: base.loadedPath || fallbackPath || null,
        };
    }
    return { isLoading: false, error: null, loadedPath: null };
});

const initialWorkspacePath = computed(() => {
    if (isSelectionMode.value) {
        const workspaceId = effectiveTeamConfig.value?.workspaceId || effectiveAgentConfig.value?.workspaceId || null;
        return resolveWorkspacePath(workspaceId);
    }
    if (effectiveTeamConfig.value) {
        return teamRunConfigStore.workspaceLoadingState.loadedPath || resolveWorkspacePath(effectiveTeamConfig.value.workspaceId);
    }
    if (effectiveAgentConfig.value) {
        return runConfigStore.workspaceLoadingState.loadedPath || resolveWorkspacePath(effectiveAgentConfig.value.workspaceId);
    }
    return '';
});

// Handlers
const handleSelectExisting = (workspaceId: string) => {
    if (isSelectionMode.value) return;

    if (effectiveTeamConfig.value) {
        teamRunConfigStore.updateConfig({ workspaceId });
        setActiveTab('files');
    } else if (effectiveAgentConfig.value) {
        runConfigStore.updateAgentConfig({ workspaceId });
        setActiveTab('files');
    }
};

const handleLoadNew = async (path: string) => {
    if (isSelectionMode.value) return;

    if (effectiveTeamConfig.value) {
        teamRunConfigStore.setWorkspaceLoading(true);
        try {
            const workspaceId = await workspaceStore.createWorkspace({ root_path: path });
            teamRunConfigStore.setWorkspaceLoaded(workspaceId, path);
            setActiveTab('files');
        } catch (error: any) {
            teamRunConfigStore.setWorkspaceError(error?.message || 'Failed to load workspace');
        }
        return;
    }

    if (effectiveAgentConfig.value) {
        runConfigStore.setWorkspaceLoading(true);
        try {
            const workspaceId = await workspaceStore.createWorkspace({ root_path: path });
            runConfigStore.setWorkspaceLoaded(workspaceId, path);
            setActiveTab('files');
        } catch (error: any) {
            runConfigStore.setWorkspaceError(error?.message || 'Failed to load workspace');
        }
    }
};

const isRunDisabled = computed(() => {
    if (!isSelectionMode.value) {
        if (effectiveTeamConfig.value) return !teamRunConfigStore.isConfigured;
        if (effectiveAgentConfig.value) return !runConfigStore.isConfigured;
    }
    return (effectiveAgentConfig.value?.isLocked || effectiveTeamConfig.value?.isLocked);
});

const handleRun = () => {
    if (!isSelectionMode.value) {
        if (effectiveTeamConfig.value) {
            teamContextsStore.createInstanceFromTemplate();
            teamRunConfigStore.clearConfig();
        } else if (effectiveAgentConfig.value) {
            contextsStore.createInstanceFromTemplate();
            runConfigStore.clearConfig();
        }
    }
};
</script>
