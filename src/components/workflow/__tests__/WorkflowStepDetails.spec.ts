
import { describe, it, expect, vi } from 'vitest';
import { mount, shallowMount } from '@vue/test-utils';
import WorkflowStepDetails from '../WorkflowStepDetails.vue';


vi.mock('@vue/apollo-composable', async () => {
  const { ref } = await import('vue');
  return {
    useQuery: vi.fn().mockReturnValue({
      result: ref({ data: [ {}, {}, {} ] }),
      loading: ref(false),
      error: ref(null)
    })
  };
});


describe('WorkflowDetails', () => {
    
  it('renders the PromptEditor with the correct template', () => {
    const selectedStepMock = {
      name: "Step One",
      prompt_template: {
        template: "Hello, {name}!",
        variables: [{
          name: "name",
          source: "DYNAMIC",
          allow_code_context_building: true,
          allow_llm_refinement: false
        }]
      }
    };

    const wrapper = mount(WorkflowStepDetails, {
      global: {
        provide: {
          selectedStep: selectedStepMock
        }
      }
    });

    const promptEditor = wrapper.findComponent({ name: 'PromptEditor' });
    expect(promptEditor.props('template').template).toBe('Hello, {name}!');
  });

  it('shows Search Code Context button if allow_code_context_building is true', () => {
    const selectedStepMock = {
      name: "Step One",
      prompt_template: {
        template: "Hello, {name}!",
        variables: [{
          name: "name",
          source: "DYNAMIC",
          allow_code_context_building: true,
          allow_llm_refinement: false
        }]
      }
    };

    const wrapper = shallowMount(WorkflowStepDetails, {
      global: {
        provide: {
          selectedStep: selectedStepMock
        }
      }
    });

    const searchContextButton = wrapper.find('.search-context-button');
    expect(searchContextButton.exists()).toBe(true);
});

  it('shows Refine Requirement button if allow_llm_refinement is true', async () => {
    const selectedStepMock = {
      name: "Step One",
      prompt_template: {
        template: "Hello, {name}!",
        variables: [{
          name: "name",
          source: "DYNAMIC",
          allow_code_context_building: false,
          allow_llm_refinement: true
        }]
      }
    };
  
    const wrapper = mount(WorkflowStepDetails, {
      global: {
        provide: {
          selectedStep: selectedStepMock
        }
      }
    });
  
    const refineRequirementButton = wrapper.find('.refine-requirement-button');
    expect(refineRequirementButton.exists()).toBe(true);
  });
  
  it('renders default execution status correctly', () => {
    const wrapper = mount(WorkflowStepDetails);
    const executionStatus = wrapper.find('p');
    expect(executionStatus.text()).toContain('Not Started');
  });
  
  it('renders correct number of CodeSearchResult components', async () => {
    const wrapper = mount(WorkflowStepDetails);
    
    // Mocking searchResults ref value
    await wrapper.setData({ searchResults: [ {}, {}, {} ] }); // Three mock search results
    
    const searchResultsComponents = wrapper.findAllComponents({ name: 'CodeSearchResult' });
    expect(searchResultsComponents.length).toBe(3);
  });
});

