import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { TextState } from '../TextState';
import { ParserContext } from '../ParserContext';
import type { AIResponseSegment } from '../../types';
import { XmlTagInitializationState } from '../XmlTagInitializationState';
import { JsonInitializationState } from '../JsonInitializationState';
import { AgentRunState } from '~/types/agent/AgentRunState';
import type { Conversation, AIMessage } from '~/types/conversation';
import { AgentContext } from '~/types/agent/AgentContext';
import type { AgentRunConfig } from '~/types/agent/AgentRunConfig';

vi.mock('~/stores/llmProviderConfig', () => ({
  useLLMProviderConfigStore: vi.fn(() => ({
    getProviderForModel: vi.fn(() => 'default'),
  })),
}));

const createMockAgentContext = (segments: AIResponseSegment[], parseToolCalls: boolean): AgentContext => {
  const conversation: Conversation = { id: 'test-conv-id', messages: [], createdAt: '', updatedAt: '' };
  const lastAIMessage: AIMessage = { type: 'ai', text: '', timestamp: new Date(), chunks: [], segments, isComplete: false, parserInstance: null as any };
  conversation.messages.push(lastAIMessage);
  const agentState = new AgentRunState('test-conv-id', conversation);
  const agentConfig: AgentRunConfig = { launchProfileId: '', workspaceId: null, llmModelName: 'test-model', autoExecuteTools: false, useXmlToolFormat: false, parseToolCalls };
  return new AgentContext(agentConfig, agentState);
};

describe('TextState', () => {
  let segments: AIResponseSegment[];
  let context: ParserContext;

  beforeEach(() => {
    setActivePinia(createPinia());
    segments = [];
    const agentContext = createMockAgentContext(segments, true);
    context = new ParserContext(agentContext);
    context.currentState = new TextState(context);
  });

  it('should append text characters to a text segment', () => {
    context.buffer = 'Hello World';
    context.currentState.run();
    expect(segments).toEqual([
      { type: 'text', content: 'Hello World' }
    ]);
  });

  it('should transition to XmlTagInitializationState when `<` encountered', () => {
    context.buffer = 'Hello <file path="test.txt">';
    context.pos = 0;
    context.currentState.run();

    expect(segments).toEqual([
      { type: 'text', content: 'Hello ' }
    ]);
    expect(context.currentState).toBeInstanceOf(XmlTagInitializationState);
  });

  it('should transition to JsonInitializationState when `{` encountered', () => {
    context.buffer = 'Some text {"tool":...}';
    context.pos = 0;
    context.currentState.run();

    expect(segments).toEqual([
      { type: 'text', content: 'Some text ' }
    ]);
    expect(context.currentState).toBeInstanceOf(JsonInitializationState);
  });

  it('should always transition when `<` is encountered, even if parseToolCalls is false', () => {
    // This is the corrected behavior. TextState doesn't care about the flag.
    const agentContext = createMockAgentContext(segments, false);
    const disabledContext = new ParserContext(agentContext);
    disabledContext.currentState = new TextState(disabledContext);
    disabledContext.buffer = 'Hello <file path="test.txt">';
    disabledContext.pos = 0;
    disabledContext.currentState.run();
  
    expect(segments).toEqual([
      { type: 'text', content: 'Hello ' }
    ]);
    expect(disabledContext.currentState).toBeInstanceOf(XmlTagInitializationState);
  });

  it('should handle empty buffer without errors', () => {
    context.buffer = '';
    context.pos = 0;
    context.currentState.run();
    expect(segments).toEqual([]);
  });

  it('should handle whitespace-only text', () => {
    context.buffer = '   \n\t  ';
    context.pos = 0;
    context.currentState.run();
    expect(segments).toEqual([
      { type: 'text', content: '   \n\t  ' }
    ]);
  });
});
