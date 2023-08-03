
import { describe, it, expect, vi } from 'vitest';
import { mount, shallowMount } from '@vue/test-utils';
import WorkflowStepDetails from '../WorkflowStepDetails.vue';
import { nextTick, ref } from 'vue';

vi.mock('@vue/apollo-composable', async () => {
  const { ref } = await import('vue');
  
  // Define the data structure
  const searchData = {
    total: 2,
    entities: [
      {
        entity: {
          file_path: 'path1',
          docstring: 'doc1',
          name: 'functionName1',
          signature: '() => void',
          type: 'function'
        },
        score: 5
      },
      {
        entity: {
          file_path: 'path2',
          docstring: 'doc2',
          name: 'functionName2',
          signature: '() => void',
          type: 'function'
        },
        score: 6
      }
    ]
  };
  
  // Convert the data structure to a JSON string
  const jsonString = JSON.stringify(searchData);

  return {
    useQuery: vi.fn().mockReturnValue({
      result: ref({
        searchCodeEntities: jsonString
      }),
      loading: ref(false),
      error: ref(null)
    })
  };
});

describe('WorkflowDetails', () => {
    
  it('renders the PromptEditor with the correct template', () => {
    const selectedStepMock = ref({
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
    });

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

  it('shows Search Code Context button if allow_code_context_building is true', async () => {
    const selectedStepMock = ref({
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
    });

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
    const selectedStepMock = ref({
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
    });
  
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
    const selectedStepMock = {
      name: "Mock Step",
      // ... other necessary properties
    };
  
    const wrapper = mount(WorkflowStepDetails, {
      global: {
        provide: {
          selectedStep: ref(selectedStepMock)
        }
      }
    });
  
    const executionStatus = wrapper.find('[data-test-id="execution-status"]');
    expect(executionStatus.exists()).toBe(true);
    expect(executionStatus.text()).toContain('Not Started');
  });
  
  it('renders correct number of CodeSearchResult components', async () => {
    // Providing the required injection for selectedStep
    const selectedStepMock = {
      name: "Mock Step",
      // ... other necessary properties
    };
  
    const wrapper = mount(WorkflowStepDetails, {
      global: {
        provide: {
          selectedStep: ref(selectedStepMock)
        }
      }
    });
    // Simulate change in rawSearchData ref (which is the mock's result ref)
    // This will mimic fetching data and should trigger the watcher
    const mockSearchData = {
      searchCodeEntities: {
        total: 3,
        entities: [
          { entity: { file_path: 'path1', docstring: 'doc1', name: 'func1', type: 'function' }, score: 5 },
          { entity: { file_path: 'path2', docstring: 'doc2', name: 'func2', type: 'function' }, score: 4 },
          { entity: { file_path: 'path3', docstring: 'doc3', name: 'func3', type: 'function' }, score: 3 }
        ]
      }
    };
    //Inside Vue component script area, we need to use .value to modify the value of reactivity object. But outside, vm.rawSearchData will automatically unwrap to value.
    wrapper.vm.rawSearchData = { searchCodeEntities: JSON.stringify(mockSearchData.searchCodeEntities)};

    await nextTick(); 

    const searchResultsComponents = wrapper.findAllComponents({ name: 'CodeSearchResult' });
  
    expect(searchResultsComponents.length).toBe(3);
  });
});

