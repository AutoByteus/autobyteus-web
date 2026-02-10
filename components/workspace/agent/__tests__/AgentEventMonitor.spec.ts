import { describe, expect, it } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import AgentEventMonitor from '../AgentEventMonitor.vue';
import type { Conversation } from '~/types/conversation';

const conversation: Conversation = {
  id: 'agent-42',
  createdAt: '2026-02-10T00:00:00.000Z',
  updatedAt: '2026-02-10T00:00:30.000Z',
  messages: [
    {
      type: 'user',
      text: 'Please write a summary.',
      timestamp: new Date('2026-02-10T00:00:01.000Z'),
      promptTokens: 10,
      promptCost: 0.1,
    },
    {
      type: 'ai',
      text: 'Sure, here is the summary.',
      timestamp: new Date('2026-02-10T00:00:02.000Z'),
      segments: [],
      isComplete: true,
      completionTokens: 20,
      completionCost: 0.2,
    },
  ],
};

describe('AgentEventMonitor.vue', () => {
  it('passes avatar/name context into AIMessage and user label into UserMessage', () => {
    const wrapper = shallowMount(AgentEventMonitor, {
      props: {
        conversation,
        agentName: 'Slide Narrator',
        agentAvatarUrl: 'https://example.com/slide-narrator.png',
      },
      global: {
        stubs: {
          AgentUserInputForm: { template: '<div class="agent-input-stub" />' },
          'agent-user-input-form': { template: '<div class="agent-input-stub" />' },
          UserMessage: {
            name: 'UserMessage',
            props: ['message', 'userDisplayName', 'userAvatarUrl'],
            template: '<div class="user-message-stub">{{ userDisplayName }}</div>',
          },
          AIMessage: {
            name: 'AIMessage',
            props: ['message', 'agentId', 'agentName', 'agentAvatarUrl', 'messageIndex'],
            template: '<div class="ai-message-stub">{{ agentName }}</div>',
          },
        },
      },
    });

    const user = wrapper.findComponent({ name: 'UserMessage' });
    expect(user.exists()).toBe(true);
    expect(user.props('userDisplayName')).toBe('You');

    const ai = wrapper.findComponent({ name: 'AIMessage' });
    expect(ai.exists()).toBe(true);
    expect(ai.props('agentId')).toBe('agent-42');
    expect(ai.props('agentName')).toBe('Slide Narrator');
    expect(ai.props('agentAvatarUrl')).toBe('https://example.com/slide-narrator.png');
    expect(ai.props('messageIndex')).toBe(1);
  });

  it('shows aggregated token usage in the footer', () => {
    const wrapper = shallowMount(AgentEventMonitor, {
      props: {
        conversation,
      },
      global: {
        stubs: {
          AgentUserInputForm: { template: '<div class="agent-input-stub" />' },
          'agent-user-input-form': { template: '<div class="agent-input-stub" />' },
          UserMessage: true,
          AIMessage: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Total: 30 tokens / $0.3000');
  });
});
