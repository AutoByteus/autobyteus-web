/* autobyteus-web/utils/aiResponseParser/stateMachine/sub_state_machines/file_parsing/__tests__/FileClosingTagState.spec.ts */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { ParserContext } from '../../../ParserContext';
import { AgentContext } from '~/types/agent/AgentContext';
import { AgentRunState } from '~/types/agent/AgentRunState';
import type { Conversation, AIMessage } from '~/types/conversation';
import type { FileSegment } from '../../../../types';
import type { AgentRunConfig } from '~/types/agent/AgentRunConfig';
import { StreamScanner } from '../../../StreamScanner';
import { FileClosingTagState } from '../FileClosingTagState';
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

describe('FileClosingTagState (Sub-State)', () => {
  let context: ParserContext;
  let segments: FileSegment[];

  beforeEach(() => {
    setActivePinia(createPinia());
    segments = [];
    const agentContext = createMockAgentContext(segments);
    context = new ParserContext(agentContext);
    context.startFileSegment('test.txt');
    context.appendToFileSegment('initial content');
  });

  it('should return null (terminate) on a valid closing tag', () => {
    // @ts-ignore - Setting scanner for test
    context.scanner = new StreamScanner('</file>');
    const state = new FileClosingTagState();
    const nextState = state.run(context);

    expect(nextState).toBeNull();
  });

  it('should revert to FileContentState if the tag is not a valid closing tag', () => {
    // @ts-ignore - Setting scanner for test
    context.scanner = new StreamScanner('<another-tag>');
    const state = new FileClosingTagState();
    const nextState = state.run(context);

    expect(nextState).toBeInstanceOf(FileContentState);
  });

  it('should append the mismatched tag back to the file content', () => {
    // @ts-ignore - Setting scanner for test
    context.scanner = new StreamScanner('<another-tag>');
    const state = new FileClosingTagState();
    state.run(context);

    const fileSegment = segments[0];
    expect(fileSegment.originalContent).toBe('initial content<another-tag>');
  });

  it('should return itself if the closing tag is incomplete', () => {
    // @ts-ignore - Setting scanner for test
    context.scanner = new StreamScanner('</fil');
    const state = new FileClosingTagState();
    const nextState = state.run(context);

    expect(nextState).toBe(state);
  });

  it('should not modify content if the closing tag is incomplete', () => {
    // @ts-ignore - Setting scanner for test
    context.scanner = new StreamScanner('</fil');
    const state = new FileClosingTagState();
    state.run(context);

    const fileSegment = segments[0];
    expect(fileSegment.originalContent).toBe('initial content');
    expect(state.getFinalBuffer()).toBe('</fil');
  });
});
