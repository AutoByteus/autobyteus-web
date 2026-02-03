import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import WorkspaceDesktopLayout from '../WorkspaceDesktopLayout.vue';
import { useAgentSelectionStore } from '~/stores/agentSelectionStore';

vi.mock('../RightSideTabs.vue', () => ({
  default: { template: '<div class="right-tabs-stub"></div>' },
}));

vi.mock('~/components/tabs/Tab.vue', () => ({
  default: { template: '<div class="tab-stub"></div>' },
}));

// Mock noVNC and Xterm to prevent import errors during testing
vi.mock('@xterm/xterm', () => ({
    Terminal: class {}
}));
vi.mock('~/lib/novnc/core/rfb', () => ({
    default: class {}
}));

// Mock child components to isolate layout logic
const AgentWorkspaceViewValue = { template: '<div class="agent-view"></div>' };
const TeamWorkspaceViewValue = { template: '<div class="team-view"></div>' };

describe('WorkspaceDesktopLayout', () => {
  const mountComponent = (initialState = {}) => {
    return shallowMount(WorkspaceDesktopLayout, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              workspaceLeftPanelLayout: {
                panels: { running: { isOpen: true } }
              },
              ...initialState
            }
          })
        ],
        stubs: {
          LeftSidePanel: { template: '<div class="left-panel-stub"></div>' },
          RightSideTabs: { template: '<div class="right-tabs-stub"></div>' },
          RightSidebarStrip: { template: '<div class="right-strip-stub"></div>' },
          AgentWorkspaceView: AgentWorkspaceViewValue,
          TeamWorkspaceView: TeamWorkspaceViewValue
        }
      }
    });
  };

  it('should render left panel when open', () => {
    const wrapper = mountComponent();
    expect(wrapper.findComponent({ name: 'LeftSidePanel' }).exists()).toBe(true);
  });

  it('should render AgentWorkspaceView when agent is selected', async () => {
    const wrapper = mountComponent({
        agentSelection: { selectedType: 'agent', selectedInstanceId: '123' }
    });
    
    expect(wrapper.findComponent({ name: 'AgentWorkspaceView' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'TeamWorkspaceView' }).exists()).toBe(false);
  });

  it('should render TeamWorkspaceView when team is selected', async () => {
    const wrapper = mountComponent({
        agentSelection: { selectedType: 'team', selectedInstanceId: '456' }
    });

    expect(wrapper.findComponent({ name: 'TeamWorkspaceView' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'AgentWorkspaceView' }).exists()).toBe(false);
  });

  it('should render placeholder when nothing is selected', () => {
    const wrapper = mountComponent({
        agentSelection: { selectedType: null, selectedInstanceId: null }
    });

    expect(wrapper.text()).toContain('Select or run an agent/team to begin');
  });
});
