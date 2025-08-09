/* autobyteus-web/utils/aiResponseParser/stateMachine/sub_state_machines/file_parsing/__tests__/FileContentState.spec.ts */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { ParserContext } from '../../../ParserContext';
import { AgentContext } from '~/types/agent/AgentContext';
import { AgentRunState } from '~/types/agent/AgentRunState';
import type { Conversation, AIMessage } from '~/types/conversation';
import type { FileSegment } from '../../../../types';
import type { AgentRunConfig } from '~/types/agent/AgentRunConfig';
import { StreamScanner } from '../../../StreamScanner';
import { FileContentState } from '../FileContentState';
import { FileClosingTagState } from '../FileClosingTagState';

vi.mock('~/stores/llmProviderConfig', () => ({
  useLLMProviderConfigStore: vi.fn(() => ({ getProviderForModel: vi.fn(() => 'default') })),
}));

const createMockAgentContext = (segments: any[]): AgentContext => {
  const conversation: Conversation = { id: 'test-conv-id', messages: [], createdAt: '', updatedAt: '' };
  const lastAIMessage: AIMessage = { type: 'ai', text: '', timestamp: new Date(), chunks: [], segments, isComplete: false, parserInstance: null as any };
  conversation.messages.push(lastAIMessage);
  const agentState = new AgentRunState('test-conv-id', conversation);
  const agentConfig: AgentRunConfig = { launchProfileId: '', workspaceId: null, llmModelIdentifier: 'test-model', autoExecuteTools: false, parseToolCalls: true };
  return new AgentContext(agentConfig, agentState);
};

describe('FileContentState (Sub-State)', () => {
  let context: ParserContext;
  let segments: FileSegment[];

  beforeEach(() => {
    setActivePinia(createPinia());
    segments = [];
    const agentContext = createMockAgentContext(segments);
    context = new ParserContext(agentContext);
    context.startFileSegment('test.txt'); // Assume we are already in a file segment
  });

  it('should append content to the file segment', () => {
    // @ts-ignore
    context.scanner = new StreamScanner('hello world');
    const state = new FileContentState();
    const nextState = state.run(context);

    expect(segments[0].originalContent).toBe('hello world');
    expect(nextState).toBe(state); // Should wait for more data
  });

  it('should transition to FileClosingTagState when "<" is encountered', () => {
    // @ts-ignore
    context.scanner = new StreamScanner('hello<');
    const state = new FileContentState();
    const nextState = state.run(context);

    expect(segments[0].originalContent).toBe('hello');
    expect(nextState).toBeInstanceOf(FileClosingTagState);
  });

  it('should skip the first newline character', () => {
    // @ts-ignore
    context.scanner = new StreamScanner('\nhello');
    const state = new FileContentState();
    state.run(context);

    expect(segments[0].originalContent).toBe('hello');
  });
});
