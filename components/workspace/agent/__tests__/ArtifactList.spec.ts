import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ArtifactList from '../ArtifactList.vue';
import type { AgentArtifact } from '~/stores/agentArtifactsStore';

describe('ArtifactList.vue', () => {
    const mockArtifacts: AgentArtifact[] = [
        { id: '1', agentId: 'a1', path: 'test.txt', type: 'file', status: 'persisted', createdAt: '', updatedAt: '' },
        { id: '2', agentId: 'a1', path: 'image.png', type: 'file', status: 'persisted', createdAt: '', updatedAt: '' },
        { id: '3', agentId: 'a1', path: 'script.py', type: 'file', status: 'streaming', createdAt: '', updatedAt: '' },
        { id: '4', agentId: 'a1', path: 'video.mp4', type: 'file', status: 'pending_approval', createdAt: '', updatedAt: '' },
    ];

    it('renders empty state when no artifacts', () => {
        const wrapper = mount(ArtifactList, {
            props: { artifacts: [] }
        });
        expect(wrapper.text()).toContain('No artifacts created yet');
    });

    it('categorizes artifacts correctly into Files and Media', () => {
        const wrapper = mount(ArtifactList, {
            props: { artifacts: mockArtifacts }
        });

        // "Media" header should exist
        expect(wrapper.text()).toContain('Media');
        // "Files" header should exist
        expect(wrapper.text()).toContain('Files');

        // Check if items are rendered
        // We can check identifying text
        expect(wrapper.text()).toContain('test.txt');
        expect(wrapper.text()).toContain('image.png');
        expect(wrapper.text()).toContain('script.py');
        expect(wrapper.text()).toContain('video.mp4');
    });

    it('emits select event when item is clicked', async () => {
         const wrapper = mount(ArtifactList, {
            props: { artifacts: mockArtifacts }
        });
        
        const items = wrapper.findAllComponents({ name: 'ArtifactItem' });
        // Media comes first in the list, so the first item should be image.png (mockArtifacts[1])
        await items[0].trigger('click');
        
        expect(wrapper.emitted('select')).toBeTruthy();
        expect(wrapper.emitted('select')?.[0][0]).toEqual(mockArtifacts[1]);
    });
});
