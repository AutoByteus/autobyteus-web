/* autobyteus-web/utils/aiResponseParser/stateMachine/sub_state_machines/file_parsing/__tests__/FileOpeningTagState.spec.ts */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { ParserContext } from '../../../ParserContext';
import { AgentContext } from '~/types/agent/AgentContext';
import { AgentRunState } from '~/types/agent/AgentRunState';
import type { Conversation, AIMessage } from '~/types/conversation';
import type { AgentRunConfig } from '~/types/agent/AgentRunConfig';
import { StreamScanner } from '../../../StreamScanner';
import { FileOpeningTagState } from '../FileOpeningTagState';
import { FileContentState } from '../FileContentState';

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

describe('FileOpeningTagState (Sub-State)', () => {
  let context: ParserContext;

  beforeEach(() => {
    setActivePinia(createPinia());
    const agentContext = createMockAgentContext([]);
    context = new ParserContext(agentContext);
  });

  it('should transition to FileContentState on a valid tag', () => {
    // @ts-ignore
    context.scanner = new StreamScanner(' path="a.txt">');
    const state = new FileOpeningTagState();
    const nextState = state.run(context);

    expect(nextState).toBeInstanceOf(FileContentState);
    expect(context.currentSegment?.type).toBe('file');
  });

  it('should return null (invalidate) on a malformed tag', () => {
    // @ts-ignore
    context.scanner = new StreamScanner(' not_a_path="a.txt">');
    const state = new FileOpeningTagState();
    const nextState = state.run(context);

    expect(nextState).toBeNull();
    expect(context.currentSegment).toBeNull();
  });

  it('should return itself if the stream is incomplete', () => {
    // @ts-ignore
    context.scanner = new StreamScanner(' path="a.txt"');
    const state = new FileOpeningTagState();
    const nextState = state.run(context);

    expect(nextState).toBe(state);
  });

  it('should return the full invalid tag in getFinalBuffer', () => {
    // @ts-ignore
    context.scanner = new StreamScanner(' not_a_path="a.txt">');
    const state = new FileOpeningTagState();
    state.run(context);

    expect(state.getFinalBuffer()).toBe('<file not_a_path="a.txt">');
  });
});
