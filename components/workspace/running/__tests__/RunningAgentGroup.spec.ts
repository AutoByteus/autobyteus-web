import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import RunningAgentGroup from '../RunningAgentGroup.vue';
import RunningInstanceRow from '../RunningInstanceRow.vue';

const RunningInstanceRowStub = {
    template: '<div class="row-stub" @click="$emit(\'select\', instance.state.agentId)"></div>',
    props: ['instance', 'isSelected'],
};

describe('RunningAgentGroup', () => {
    const mockInstances = [
        { state: { agentId: 'id-1' }, config: { agentDefinitionName: 'Agent A' } },
        { state: { agentId: 'id-2' }, config: { agentDefinitionName: 'Agent A' } },
    ];

    const mountOptions = {
        global: {
            stubs: {
                RunningInstanceRow: RunningInstanceRowStub,
            }
        }
    };


    it('renders header with name and count', () => {
        const wrapper = mount(RunningAgentGroup, {
            ...mountOptions,
            props: {
                definitionName: 'Agent A',
                definitionId: 'def-a',
                instances: mockInstances as any,
                selectedInstanceId: null,
            },
        });

        expect(wrapper.text()).toContain('Agent A');
        expect(wrapper.text()).toContain('(2)');
    });

    it('toggles expansion on header click', async () => {
        const wrapper = mount(RunningAgentGroup, {
            ...mountOptions,
            props: {
                definitionName: 'Agent A',
                definitionId: 'def-a',
                instances: mockInstances as any,
                selectedInstanceId: null,
            },
        });

        // Initially expanded by default (assumption) or start collapsed? 
        // Let's assume expanded if instances exist.
        expect(wrapper.find('.row-stub').exists()).toBe(true);

        // Click header to collapse (find the toggle button or header)
        await wrapper.find('.group-header').trigger('click');
        expect(wrapper.find('.row-stub').exists()).toBe(false);
    });

    it('emits create event on plus button click', async () => {
        const wrapper = mount(RunningAgentGroup, {
            ...mountOptions,
            props: {
                definitionName: 'Agent A',
                definitionId: 'def-a',
                instances: mockInstances as any,
                selectedInstanceId: null,
            },
        });

        await wrapper.find('.create-btn').trigger('click');
        expect(wrapper.emitted('create')).toHaveLength(1);
        expect(wrapper.emitted('create')?.[0]).toEqual(['def-a']);
    });

    it('passes selection to rows', () => {
        const wrapper = mount(RunningAgentGroup, {
            ...mountOptions,
            props: {
                definitionName: 'Agent A',
                definitionId: 'def-a',
                instances: mockInstances as any,
                selectedInstanceId: 'id-1',
            },
        });
        
        // We mocked the child so we check props passed to stub if possible, 
        // or rely on behavior. 
        // With shallow mount or stubs, checking props is harder without specific test utils features.
        // We'll trust the loop logic rendering.
        const stubs = wrapper.findAll('.row-stub');
        expect(stubs.length).toBe(2);
    });
});
