import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import WorkspaceRunsSection from '../WorkspaceRunsSection.vue';

describe('WorkspaceRunsSection', () => {
  const mountComponent = () => mount(WorkspaceRunsSection, {
    props: {
      workspaceNodes: [
        {
          workspaceRootPath: '/ws/a',
          workspaceName: 'Temp Workspace',
          agents: [
            {
              agentDefinitionId: 'agent-def-1',
              agentName: 'Super Agent',
              agentAvatarUrl: null,
              runs: [
                {
                  agentId: 'run-1',
                  summary: 'Do work',
                  lastActivityAt: '2026-01-01T00:00:00.000Z',
                  lastKnownStatus: 'IDLE',
                  isActive: false,
                  source: 'history',
                  isDraft: false,
                },
              ],
            },
          ],
          teams: [
            {
              teamId: 'team-1',
              teamDefinitionId: 'team-def-1',
              teamDefinitionName: 'Class Room Simulation',
              summary: 'summary',
              lastActivityAt: '2026-01-01T00:00:00.000Z',
              lastKnownStatus: 'IDLE',
              isActive: false,
              deleteLifecycle: 'READY',
              members: [
                {
                  teamId: 'team-1',
                  memberRouteKey: 'professor',
                  memberName: 'Professor',
                  memberAgentId: 'ag-1',
                  workspaceRootPath: '/Users/normy/temp_workspace',
                  hostNodeId: null,
                  summary: 'summary',
                  lastActivityAt: '2026-01-01T00:00:00.000Z',
                  lastKnownStatus: 'IDLE',
                  isActive: false,
                  deleteLifecycle: 'READY',
                },
              ],
            },
          ],
        },
      ],
      selectedAgentId: null,
      selectedTeamId: null,
      selectedTeamMemberRouteKey: null,
      expandedWorkspace: {},
      expandedAgents: {},
      expandedTeams: {},
      terminatingAgentIds: {},
      terminatingTeamIds: {},
      deletingAgentIds: {},
      deletingTeamIds: {},
      showAgentAvatar: () => false,
      formatRelativeTime: () => 'now',
    },
    global: {
      stubs: {
        Icon: { template: '<span class="icon-stub" />' },
      },
    },
  });

  it('emits run selection and create-run intent', async () => {
    const wrapper = mountComponent();

    const runButton = wrapper.findAll('button').find((button) => button.text().includes('Do work'));
    expect(runButton).toBeTruthy();
    await runButton!.trigger('click');

    const createRunButton = wrapper.find('button[title="New run with this agent"]');
    await createRunButton.trigger('click');

    expect(wrapper.emitted('select-run')).toBeTruthy();
    expect(wrapper.emitted('create-run')?.[0]).toEqual(['/ws/a', 'agent-def-1']);
  });

  it('emits delete-run when delete button is clicked', async () => {
    const wrapper = mountComponent();
    const deleteButton = wrapper.find('button[title="Delete run permanently"]');
    expect(deleteButton.exists()).toBe(true);

    await deleteButton.trigger('click');
    expect(wrapper.emitted('delete-run')).toBeTruthy();
  });

  it('emits select-member and omits member workspace suffix text', async () => {
    const wrapper = mountComponent();

    expect(wrapper.text()).toContain('Professor');
    expect(wrapper.text()).not.toContain('temp_workspace');

    const memberButton = wrapper.findAll('button').find((button) => button.text().includes('Professor'));
    expect(memberButton).toBeTruthy();
    await memberButton!.trigger('click');

    expect(wrapper.emitted('select-member')).toBeTruthy();
  });

  it('emits team delete intent', async () => {
    const wrapper = mountComponent();
    const deleteTeamButton = wrapper.find('button[title="Delete team history"]');
    expect(deleteTeamButton.exists()).toBe(true);
    await deleteTeamButton.trigger('click');
    expect(wrapper.emitted('delete-team')?.[0]).toEqual(['team-1']);
  });
});
