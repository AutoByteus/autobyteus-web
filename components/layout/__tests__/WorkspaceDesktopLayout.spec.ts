import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import WorkspaceDesktopLayout from '../WorkspaceDesktopLayout.vue';
import { useAgentSelectionStore } from '~/stores/agentSelectionStore';

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
    return mount(WorkspaceDesktopLayout, {
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
          RunningAgentsPanel: true,
          RunConfigPanel: true,
          RightSideTabs: true,
          RightSidebarStrip: true,
          AgentWorkspaceView: AgentWorkspaceViewValue,
          TeamWorkspaceView: TeamWorkspaceViewValue
        }
      }
    });
  };

  it('should render running and config panels when open', () => {
    const wrapper = mountComponent();
    expect(wrapper.findComponent({ name: 'RunningAgentsPanel' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'RunConfigPanel' }).exists()).toBe(true);
  });

  it('should render AgentWorkspaceView when agent is selected', async () => {
    const wrapper = mountComponent({
        agentSelection: { selectedType: 'agent', selectedInstanceId: '123' }
    });
    
    expect(wrapper.findComponent(AgentWorkspaceViewValue).exists()).toBe(true);
    expect(wrapper.findComponent(TeamWorkspaceViewValue).exists()).toBe(false);
  });

  it('should render TeamWorkspaceView when team is selected', async () => {
    const wrapper = mountComponent({
        agentSelection: { selectedType: 'team', selectedInstanceId: '456' }
    });

    expect(wrapper.findComponent(TeamWorkspaceViewValue).exists()).toBe(true);
    expect(wrapper.findComponent(AgentWorkspaceViewValue).exists()).toBe(false);
  });

  it('should render placeholder when nothing is selected', () => {
    const wrapper = mountComponent({
        agentSelection: { selectedType: null, selectedInstanceId: null }
    });

    expect(wrapper.text()).toContain('Select or run an agent/team to begin');
  });
});
