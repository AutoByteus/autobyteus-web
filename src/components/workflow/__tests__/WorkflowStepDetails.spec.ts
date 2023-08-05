// src/components/workflow/__tests__/WorkflowStepDetails.spec.ts

import { describe, it, expect, vi } from 'vitest';
import { mount, shallowMount } from '@vue/test-utils';
import WorkflowStepDetails from '../WorkflowStepDetails.vue';
import { nextTick, ref } from 'vue';

vi.mock('@vue/apollo-composable', async () => {
  const { ref } = await import('vue');
  
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
  
  const jsonString = JSON.stringify(searchData);
  
  const useLazyQuery = () => {
    return {
      load: () => {},
      onResult: (callback) => {
        callback({
          data: {
            searchCodeEntities: jsonString
          }
        });
      }
    };
  };

  return {
    useQuery: vi.fn().mockReturnValue({
      result: ref({
        searchCodeEntities: jsonString
      }),
      loading: ref(false),
      error: ref(null)
    }),
    useLazyQuery: useLazyQuery
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

  it('updates promptVariables when PromptEditor emits update:variable', async () => {
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
    promptEditor.vm.$emit('update:variable', { variableName: 'name', value: 'John' });

    await nextTick();

    expect(wrapper.vm.promptVariables.name).toBe('John');
  });

  it('calls searchCodeContext and updates processedSearchData on button click', async () => {
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

    const searchContextButton = wrapper.find('.search-context-button');
    searchContextButton.trigger('click');

    await nextTick();

    expect(wrapper.vm.processedSearchData.length).toBe(2);
    expect(wrapper.vm.processedSearchData[0].entity.file_path).toBe('path1');
  });

  it('updates executionStatus to Running when Start Execution button is clicked', async () => {
    const selectedStepMock = {
      name: "Mock Step",
    };

    const wrapper = mount(WorkflowStepDetails, {
      global: {
        provide: {
          selectedStep: ref(selectedStepMock)
        }
      }
    });

    const startExecutionButton = wrapper.find('.start-execution-button');
    startExecutionButton.trigger('click');

    await nextTick();

    const executionStatus = wrapper.find('[data-test-id="execution-status"]');
    expect(executionStatus.text()).toContain('Running');
  });

  it('renders correct number of CodeSearchResult components', async () => {
    const selectedStepMock = {
      name: "Mock Step",
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
          selectedStep: ref(selectedStepMock)
        }
      }
    });

    const searchContextButton = wrapper.find('.search-context-button');
    searchContextButton.trigger('click');

    await nextTick();

    const searchResultsComponents = wrapper.findAllComponents({ name: 'CodeSearchResult' });

    expect(searchResultsComponents.length).toBe(2);
  });
});
