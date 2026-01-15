import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import RunningInstanceRow from '../RunningInstanceRow.vue';
import { AgentStatus } from '~/types/agent/AgentStatus';

describe('RunningInstanceRow', () => {
  const mockInstance = {
    state: {
      agentId: 'agent-123',
      currentStatus: AgentStatus.Idle,
    },
    config: {
      agentDefinitionName: 'TestAgent',
    },
  };

  it('renders instance ID (name is in parent group)', () => {
    const wrapper = mount(RunningInstanceRow, {
      props: {
        instance: mockInstance as any,
        isSelected: false,
      },
    });

    // Instance row now only shows ID (name is displayed in parent group)
    expect(wrapper.text()).toContain('agent-12'); // Truncated ID
  });

  it('emits select event on click', async () => {
    const wrapper = mount(RunningInstanceRow, {
      props: {
        instance: mockInstance as any,
        isSelected: false,
      },
    });

    await wrapper.trigger('click');
    expect(wrapper.emitted('select')).toHaveLength(1);
    expect(wrapper.emitted('select')?.[0]).toEqual(['agent-123']);
  });

  it('emits delete event on button click', async () => {
    const wrapper = mount(RunningInstanceRow, {
      props: {
        instance: mockInstance as any,
        isSelected: false,
      },
    });

    // Find delete button/icon (assuming class or data attribute)
    const deleteBtn = wrapper.find('button.delete-btn');
    await deleteBtn.trigger('click');
    
    expect(wrapper.emitted('delete')).toHaveLength(1);
    expect(wrapper.emitted('delete')?.[0]).toEqual(['agent-123']);
    
    // Should NOT emit select when deleting
    expect(wrapper.emitted('select')).toBeUndefined();
  });

  it('applies selected styles', () => {
    const wrapper = mount(RunningInstanceRow, {
      props: {
        instance: mockInstance as any,
        isSelected: true,
      },
    });

    expect(wrapper.classes()).toContain('bg-emerald-50'); // Selected state uses emerald
  });

  it('shows status indicator', () => {
    const wrapper = mount(RunningInstanceRow, {
      props: {
        instance: { ...mockInstance, state: { ...mockInstance.state, currentStatus: AgentStatus.Error } } as any,
        isSelected: false,
      },
    });

    const indicator = wrapper.find('.status-indicator');
    expect(indicator.classes()).toContain('bg-red-500'); // Assuming error maps to red
  });
});
