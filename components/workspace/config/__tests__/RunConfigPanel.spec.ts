import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { reactive } from 'vue';
import RunConfigPanel from '../RunConfigPanel.vue';
import AgentRunConfigForm from '../AgentRunConfigForm.vue';
import TeamRunConfigForm from '../TeamRunConfigForm.vue';
import { useAgentSelectionStore } from '~/stores/agentSelectionStore';

// Hoisted state objects
const { agentRunState, teamRunState, agentContextState, teamContextState } = vi.hoisted(() => ({
    agentRunState: {
        config: null,
        workspaceLoadingState: { isLoading: false, error: null, loadedPath: null },
        isConfigured: false,
        setWorkspaceLoading: vi.fn(),
        setWorkspaceLoaded: vi.fn(),
        setWorkspaceError: vi.fn(),
        clearConfig: vi.fn()
    },
    teamRunState: {
        config: null,
        workspaceLoadingState: { isLoading: false, error: null, loadedPath: null },
        isConfigured: false,
        setWorkspaceLoading: vi.fn(),
        setWorkspaceLoaded: vi.fn(),
        setWorkspaceError: vi.fn(),
        clearConfig: vi.fn()
    },
    agentContextState: {
        activeInstance: null,
        createInstanceFromTemplate: vi.fn()
    },
    teamContextState: {
        activeTeamContext: null,
        createInstanceFromTemplate: vi.fn()
    }
}));

// Mocks
vi.mock('~/stores/agentRunConfigStore', async () => {
    const { reactive } = await import('vue');
    return { useAgentRunConfigStore: () => reactive(agentRunState) };
});

vi.mock('~/stores/teamRunConfigStore', async () => {
    const { reactive } = await import('vue');
    return { useTeamRunConfigStore: () => reactive(teamRunState) };
});

vi.mock('~/stores/agentContextsStore', async () => {
    const { reactive } = await import('vue');
    return { useAgentContextsStore: () => reactive(agentContextState) };
});

vi.mock('~/stores/agentTeamContextsStore', async () => {
    const { reactive } = await import('vue');
    return { useAgentTeamContextsStore: () => reactive(teamContextState) };
});

vi.mock('~/stores/workspace', () => ({
    useWorkspaceStore: () => ({
        createWorkspace: vi.fn(),
        workspaces: {},
        allWorkspaces: [],
        tempWorkspaceId: null,
        tempWorkspace: null,
        fetchAllWorkspaces: vi.fn().mockResolvedValue([]),
    })
}));

vi.mock('~/stores/agentDefinitionStore', () => ({
  useAgentDefinitionStore: () => ({
    getAgentDefinitionById: (id: string) => ({ id, name: 'Agent ' + id })
  })
}));

vi.mock('~/stores/agentTeamDefinitionStore', () => ({
  useAgentTeamDefinitionStore: () => ({
    getAgentTeamDefinitionById: (id: string) => ({ id, name: 'Team ' + id, nodes: [] })
  })
}));

describe('RunConfigPanel', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        // Reset manual states
        agentRunState.config = null;
        teamRunState.config = null;
        agentContextState.activeInstance = null;
        teamContextState.activeTeamContext = null;
    });

    it('renders placeholder when nothing selected', () => {
        const wrapper = mount(RunConfigPanel, {
            global: {
                stubs: { AgentRunConfigForm: true, TeamRunConfigForm: true }
            }
        });
        expect(wrapper.text()).toContain('Select an agent or team');
    });

    it('renders Agent Form when Agent Template set', async () => {
        const { useAgentRunConfigStore } = await import('~/stores/agentRunConfigStore');
        const store = useAgentRunConfigStore();
        store.config = { agentDefinitionId: 'def-1', workspaceId: null } as any;
        store.isConfigured = true;

        const wrapper = mount(RunConfigPanel, {
            global: {
                stubs: { AgentRunConfigForm: true, TeamRunConfigForm: true }
            }
        });

        expect(wrapper.findComponent(AgentRunConfigForm).exists()).toBe(true);
    });

    it('renders Team Form when Team Template set', async () => {
        const { useTeamRunConfigStore } = await import('~/stores/teamRunConfigStore');
        const store = useTeamRunConfigStore();
        store.config = { teamDefinitionId: 'team-def-1', workspaceId: null } as any;
        store.isConfigured = true;
        
        const selectionStore = useAgentSelectionStore();
        selectionStore.clearSelection();

        const wrapper = mount(RunConfigPanel, {
            global: {
                stubs: { AgentRunConfigForm: true, TeamRunConfigForm: true }
            }
        });

        expect(wrapper.findComponent(TeamRunConfigForm).exists()).toBe(true);
    });

    it('renders Team Form when Team Instance selected', async () => {
        const selectionStore = useAgentSelectionStore();
        selectionStore.selectInstance('team-1', 'team');
        
        const { useAgentTeamContextsStore } = await import('~/stores/agentTeamContextsStore');
        const store = useAgentTeamContextsStore();
        store.activeTeamContext = { config: { teamDefinitionId: 'team-def-1' }, teamId: 'team-1' } as any;

        const wrapper = mount(RunConfigPanel, {
            global: {
                stubs: { AgentRunConfigForm: true, TeamRunConfigForm: true }
            }
        });

        expect(wrapper.findComponent(TeamRunConfigForm).exists()).toBe(true);
    });

    it('triggers team run on button click', async () => {
         const { useTeamRunConfigStore } = await import('~/stores/teamRunConfigStore');
         const teamStore = useTeamRunConfigStore();
         teamStore.config = { teamDefinitionId: 'team-def-1', workspaceId: 'ws-1' } as any;
         teamStore.isConfigured = true;
         
         const wrapper = mount(RunConfigPanel, {
            global: {
                stubs: { AgentRunConfigForm: true, TeamRunConfigForm: true }
            }
        });

        await wrapper.find('.run-btn').trigger('click');
        
        // Check create call
        const { useAgentTeamContextsStore } = await import('~/stores/agentTeamContextsStore');
        const contextStore = useAgentTeamContextsStore();
        expect(contextStore.createInstanceFromTemplate).toHaveBeenCalled();
        expect(teamStore.clearConfig).toHaveBeenCalled();
    });
});
