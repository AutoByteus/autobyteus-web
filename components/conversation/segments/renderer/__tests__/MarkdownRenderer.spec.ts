import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import MarkdownRenderer from '../conversation/segments/renderer/MarkdownRenderer.vue';
import { plantumlService } from '~/services/plantumlService';

// Mock plantumlService
vi.mock('~/services/plantumlService', () => ({
  plantumlService: {
    generateDiagram: vi.fn()
  }
}));

describe('MarkdownRenderer', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('should render markdown content correctly', () => {
    const wrapper = mount(MarkdownRenderer, {
      props: {
        content: '# Hello World'
      }
    });

    expect(wrapper.html()).toContain('<h1>Hello World</h1>');
  });

  it('should render plantuml diagram with loading state', () => {
    const wrapper = mount(MarkdownRenderer, {
      props: {
        content: '```plantuml\n@startuml\nA -> B\n@enduml\n```'
      }
    });

    expect(wrapper.html()).toContain('class="plantuml-diagram"');
    expect(wrapper.html()).toContain('Loading diagram');
  });

  it('should process plantuml diagrams and show images', async () => {
    // Mock successful diagram generation
    const mockBlob = new Blob(['fake-image-data'], { type: 'image/png' });
    vi.mocked(plantumlService.generateDiagram).mockResolvedValue(mockBlob);

    const wrapper = mount(MarkdownRenderer, {
      props: {
        content: '```plantuml\n@startuml\nA -> B\n@enduml\n```'
      }
    });

    // Wait for all promises to resolve
    await nextTick();
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(plantumlService.generateDiagram).toHaveBeenCalled();
    expect(wrapper.find('img').exists()).toBe(true);
    expect(wrapper.find('.loading').attributes('style')).toContain('display: none');
  });

  it('should handle plantuml service errors', async () => {
    // Mock failed diagram generation
    vi.mocked(plantumlService.generateDiagram).mockRejectedValue(new Error('Failed to generate'));

    const wrapper = mount(MarkdownRenderer, {
      props: {
        content: '```plantuml\n@startuml\nA -> B\n@enduml\n```'
      }
    });

    // Wait for all promises to resolve
    await nextTick();
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(wrapper.find('.error').attributes('style')).not.toContain('display: none');
    expect(wrapper.html()).toContain('Failed to render diagram');
  });

  it('should cleanup object URLs on unmount', async () => {
    // Mock successful diagram generation
    const mockBlob = new Blob(['fake-image-data'], { type: 'image/png' });
    vi.mocked(plantumlService.generateDiagram).mockResolvedValue(mockBlob);

    const wrapper = mount(MarkdownRenderer, {
      props: {
        content: '```plantuml\n@startuml\nA -> B\n@enduml\n```'
      }
    });

    // Wait for processing
    await nextTick();
    await new Promise(resolve => setTimeout(resolve, 0));

    // Unmount component
    wrapper.unmount();

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });
});