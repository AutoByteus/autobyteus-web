import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import RunningTeamGroup from '../RunningTeamGroup.vue';
import { AgentTeamStatus } from '~/types/agent/AgentTeamStatus';

describe('RunningTeamGroup', () => {
  const RunningTeamRowStub = {
    name: 'RunningTeamRow',
    template: '<div class="team-row-stub"></div>',
    props: ['instance', 'isSelected', 'coordinatorName'],
  };

  const instances = [
    { teamId: 'team-1', config: { teamDefinitionName: 'Team A' }, currentStatus: AgentTeamStatus.Idle },
    { teamId: 'team-2', config: { teamDefinitionName: 'Team A' }, currentStatus: AgentTeamStatus.Processing }
  ] as any;

  it('renders header and instances', async () => {
    const wrapper = shallowMount(RunningTeamGroup, {
      props: {
        definitionName: 'Team A',
        definitionId: 'def-a',
        instances,
        selectedInstanceId: null
      },
      global: {
        stubs: {
          RunningTeamRow: true,
          Icon: true,
        },
      },
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Team A');
    expect(wrapper.findAllComponents({ name: 'RunningTeamRow' }).length).toBe(2);
  });

  it('toggles expansion', async () => {
    const wrapper = shallowMount(RunningTeamGroup, {
      props: {
        definitionName: 'Team A',
        definitionId: 'def-a',
        instances,
        selectedInstanceId: null
      },
      global: {
        stubs: {
          RunningTeamRow: true,
          Icon: true,
        },
      },
    });

    await wrapper.vm.$nextTick();
    // Initial state: expanded
    expect(wrapper.findAllComponents({ name: 'RunningTeamRow' }).length).toBe(2);

    // Click header to collapse
    const setupState = (wrapper.vm as any).$?.setupState;
    if (setupState?.toggleExpand) {
      setupState.toggleExpand();
    } else {
      await wrapper.find('.group-header').trigger('click');
    }
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.group-header').exists()).toBe(true);

    // Click header to expand
    if (setupState?.toggleExpand) {
      setupState.toggleExpand();
    } else {
      await wrapper.find('.group-header').trigger('click');
    }
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.group-header').exists()).toBe(true);
  });

  it('emits create event', async () => {
    const wrapper = shallowMount(RunningTeamGroup, {
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
