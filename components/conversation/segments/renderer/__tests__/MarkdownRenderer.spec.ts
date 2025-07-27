import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import MarkdownRenderer from '~/components/conversation/segments/renderer/MarkdownRenderer.vue';
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
    expect(wrapper.html()).toContain('Generating diagram...');
  });

  it('should process plantuml diagrams and show images', async () => {
    const mockBlob = new Blob(['fake-image-data'], { type: 'image/png' });
    vi.mocked(plantumlService.generateDiagram).mockResolvedValue(mockBlob);

    const wrapper = mount(MarkdownRenderer, {
      props: {
        content: '```plantuml\n@startuml\nA -> B\n@enduml\n```'
      }
    });

    await nextTick(); // For Vue's reactivity
    // Wait for loadDiagram's async operations
    await new Promise(resolve => setTimeout(resolve, 0)); 


    expect(plantumlService.generateDiagram).toHaveBeenCalled();
    expect(wrapper.find('.loading-state').exists()).toBe(false);
    expect(wrapper.find('.error-state').exists()).toBe(false);
    expect(wrapper.find('.diagram-content img').exists()).toBe(true);
  });

  it('should handle errors where response.data is an object with detail', async () => {
    const fullDetailMessage = 'Error: Syntax issue in diagram.';
    const mockError = {
      response: {
        data: {
          detail: fullDetailMessage
        }
      },
      message: 'Request failed with status code 500' // Axios original message
    };
    vi.mocked(plantumlService.generateDiagram).mockRejectedValue(mockError);

    const wrapper = mount(MarkdownRenderer, {
      props: {
        content: '```plantuml\nError Diagram\n```'
      }
    });

    await nextTick();
    await new Promise(resolve => setTimeout(resolve, 0));


    const errorStateDiv = wrapper.find('.error-state');
    expect(errorStateDiv.exists()).toBe(true);
    expect(errorStateDiv.text()).toContain(fullDetailMessage); // Should use the 'detail' field
  });

  it('should handle errors where response.data is a JSON string with detail', async () => {
    const detailContent = 'Error from stringified JSON detail.';
    const mockError = {
      response: {
        data: JSON.stringify({ detail: detailContent })
      },
      message: 'Request failed with status code 500'
    };
    vi.mocked(plantumlService.generateDiagram).mockRejectedValue(mockError);

    const wrapper = mount(MarkdownRenderer, {
      props: {
        content: '```plantuml\nString JSON Error\n```'
      }
    });

    await nextTick();
    await new Promise(resolve => setTimeout(resolve, 0));


    const errorStateDiv = wrapper.find('.error-state');
    expect(errorStateDiv.exists()).toBe(true);
    expect(errorStateDiv.text()).toContain(detailContent);
  });
  
  it('should handle errors where response.data is a Blob containing JSON with detail', async () => {
    const detailContent = 'Error from Blob JSON detail.';
    const errorJson = JSON.stringify({ detail: detailContent });
    const errorBlob = new Blob([errorJson], { type: 'application/json' });
    
    const mockError = {
      response: {
        data: errorBlob 
      },
      message: 'Request failed with status code 500'
    };
    vi.mocked(plantumlService.generateDiagram).mockRejectedValue(mockError);

    const wrapper = mount(MarkdownRenderer, {
      props: {
        content: '```plantuml\nBlob JSON Error\n```'
      }
    });

    await nextTick();
    // The plantumlService now has an await responseData.text()
    // which needs to be flushed by waiting for promises.
    await new Promise(resolve => setTimeout(resolve, 0));


    const errorStateDiv = wrapper.find('.error-state');
    expect(errorStateDiv.exists()).toBe(true);
    expect(errorStateDiv.text()).toContain(detailContent);
  });


  it('should fallback to error.message if detail is not found', async () => {
    const axiosErrorMessage = 'Request failed with status code 500';
    const mockError = {
      response: {
        data: {备注: "no detail field here" } // Deliberately no 'detail'
      },
      message: axiosErrorMessage
    };
    vi.mocked(plantumlService.generateDiagram).mockRejectedValue(mockError);

    const wrapper = mount(MarkdownRenderer, {
      props: {
        content: '```plantuml\nNo Detail Error\n```'
      }
    });

    await nextTick();
    await new Promise(resolve => setTimeout(resolve, 0));


    const errorStateDiv = wrapper.find('.error-state');
    expect(errorStateDiv.exists()).toBe(true);
    expect(errorStateDiv.text()).toContain(axiosErrorMessage); // Fallback to error.message
  });

  it('should use generic fallback if no usable error message found', async () => {
    vi.mocked(plantumlService.generateDiagram).mockRejectedValue({ message: '' }); // Empty error object

    const wrapper = mount(MarkdownRenderer, {
      props: {
        content: '```plantuml\nEmpty Error Obj\n```'
      }
    });

    await nextTick();
    await new Promise(resolve => setTimeout(resolve, 0));


    const errorStateDiv = wrapper.find('.error-state');
    expect(errorStateDiv.exists()).toBe(true);
    expect(errorStateDiv.text()).toContain('An unexpected error occurred while generating the diagram.');
  });
  
  it('should use PlantUMLDiagram fallback if service throws Error with empty string', async () => {
    vi.mocked(plantumlService.generateDiagram).mockRejectedValue(new Error('')); 

    const wrapper = mount(MarkdownRenderer, {
      props: {
        content: '```plantuml\nEmpty Error String\n```'
      }
    });

    await nextTick();
    await new Promise(resolve => setTimeout(resolve, 0));

    const errorStateDiv = wrapper.find('.error-state');
    expect(errorStateDiv.exists()).toBe(true);
    expect(errorStateDiv.text()).toContain('Failed to generate diagram.');
  });


  it('should cleanup object URLs on unmount', async () => {
    const mockBlob = new Blob(['fake-image-data'], { type: 'image/png' });
    vi.mocked(plantumlService.generateDiagram).mockResolvedValue(mockBlob);

    const wrapper = mount(MarkdownRenderer, {
      props: {
        content: '```plantuml\nA -> B\n```'
      }
    });

    await nextTick();
    await new Promise(resolve => setTimeout(resolve, 0));

    wrapper.unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });
});
