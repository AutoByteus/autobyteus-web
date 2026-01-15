import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import RunningTeamGroup from '../RunningTeamGroup.vue';
import RunningTeamRow from '../RunningTeamRow.vue';
import { AgentTeamStatus } from '~/types/agent/AgentTeamStatus';

describe('RunningTeamGroup', () => {
  const instances = [
    { teamId: 'team-1', config: { teamDefinitionName: 'Team A' }, currentStatus: AgentTeamStatus.Idle },
    { teamId: 'team-2', config: { teamDefinitionName: 'Team A' }, currentStatus: AgentTeamStatus.Processing }
  ] as any;

  it('renders header and instances', () => {
    const wrapper = mount(RunningTeamGroup, {
      props: {
        definitionName: 'Team A',
        definitionId: 'def-a',
        instances,
        selectedInstanceId: null
      }
    });

    expect(wrapper.text()).toContain('Team A');
    expect(wrapper.findAllComponents(RunningTeamRow).length).toBe(2);
  });

  it('toggles expansion', async () => {
    const wrapper = mount(RunningTeamGroup, {
      props: {
        definitionName: 'Team A',
        definitionId: 'def-a',
        instances,
        selectedInstanceId: null
      }
    });

    // Initial state: expanded
    expect(wrapper.findAllComponents(RunningTeamRow).length).toBe(2);

    // Click header to collapse
    await wrapper.find('.group-header').trigger('click');
    expect(wrapper.findAllComponents(RunningTeamRow).length).toBe(0);

    // Click header to expand
    await wrapper.find('.group-header').trigger('click');
    expect(wrapper.findAllComponents(RunningTeamRow).length).toBe(2);
  });

  it('emits create event', async () => {
    const wrapper = mount(RunningTeamGroup, {
      props: {
        definitionName: 'Team A',
        definitionId: 'def-a',
        instances,
        selectedInstanceId: null
      }
    });

    await wrapper.find('.create-btn').trigger('click');
    expect(wrapper.emitted('create')?.[0]).toEqual(['def-a']);
  });
});
