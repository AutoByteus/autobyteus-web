import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { JsonInitializationState } from '../JsonInitializationState';
import { TextState } from '../TextState';
import { ToolParsingState } from '../ToolParsingState';
import { ParserContext } from '../ParserContext';
import { ParserStateType } from '../State';
import type { AIResponseSegment } from '../../types';
import { AgentRunState } from '~/types/agent/AgentRunState';
import type { Conversation, AIMessage } from '~/types/conversation';
import { AgentContext } from '~/types/agent/AgentContext';
import type { AgentRunConfig } from '~/types/agent/AgentRunConfig';
import { LLMProvider } from '~/types/llm';

vi.mock('~/utils/toolUtils', () => ({
  generateBaseInvocationId: () => 'mock_id'
}));

vi.mock('~/stores/llmProviderConfig', () => ({
  useLLMProviderConfigStore: vi.fn(() => ({
    getProviderForModel: (modelName: string) => {
      if (modelName === 'openai-model') return LLMProvider.OPENAI;
      return LLMProvider.DEFAULT;
    },
  })),
}));

const createMockAgentContext = (segments: AIResponseSegment[], parseToolCalls: boolean): AgentContext => {
  const conversation: Conversation = { id: 'test-conv-id', messages: [], createdAt: '', updatedAt: '' };
  const lastAIMessage: AIMessage = { type: 'ai', text: '', timestamp: new Date(), chunks: [], segments, isComplete: false, parserInstance: null as any };
  conversation.messages.push(lastAIMessage);
  const agentState = new AgentRunState('test-conv-id', conversation);
  const agentConfig: AgentRunConfig = {
    launchProfileId: 'lp-1',
    workspaceId: null,
    llmModelName: 'openai-model',
    autoExecuteTools: false,
    useXmlToolFormat: false, // Important for this test
    parseToolCalls: parseToolCalls,
  };
  return new AgentContext(agentConfig, agentState);
};

describe('JsonInitializationState', () => {
  let segments: AIResponseSegment[];
  let context: ParserContext;

  beforeEach(() => {
    setActivePinia(createPinia()); // Set up a fresh Pinia instance for each test
    segments = [];
  });

  it('should transition to ToolParsingState on a matching signature when parsing is enabled', () => {
    const agentContext = createMockAgentContext(segments, true);
    context = new ParserContext(agentContext);
    context.buffer = '{"tool_calls": [{}]}';
    context.pos = 0;
    // The TextState would have found '{' and transitioned us, so we start from JsonInitializationState
    context.currentState = new JsonInitializationState(context);
    context.currentState.run();
    expect(context.currentState.stateType).toBe(ParserStateType.TOOL_PARSING_STATE);
  });

  it('should transition back to TextState if signature does not match', () => {
    const agentContext = createMockAgentContext(segments, true);
    context = new ParserContext(agentContext);
    context.buffer = '{"not_a_tool": "value"}';
    context.pos = 0;
    context.currentState = new JsonInitializationState(context);
    context.currentState.run();

    expect(context.currentState.stateType).toBe(ParserStateType.TEXT_STATE);
    // Run the text state to process the buffer
    context.currentState.run();
    expect(segments).toEqual([{ type: 'text', content: '{"not_a_tool": "value"}' }]);
  });

  it('should revert to TextState if a tool signature matches but parsing is disabled', () => {
    const agentContext = createMockAgentContext(segments, false); // parsing disabled
    context = new ParserContext(agentContext);
    context.buffer = '{"tool_calls": [{}]}'; // a valid JSON tool signature
    context.pos = 0;
    context.currentState = new JsonInitializationState(context);
    context.currentState.run();

    expect(context.currentState.stateType).toBe(ParserStateType.TEXT_STATE);
    context.currentState.run();
    expect(segments).toEqual([{ type: 'text', content: '{"tool_calls": [{}]}' }]);
  });

  it('should wait for more characters for a partial match', () => {
    const agentContext = createMockAgentContext(segments, true);
    context = new ParserContext(agentContext);
    context.buffer = '{"tool_c';
    context.pos = 0;
    context.currentState = new JsonInitializationState(context);
    context.currentState.run();

    expect(context.currentState.stateType).toBe(ParserStateType.JSON_INITIALIZATION_STATE);
    expect(context.pos).toBe(context.buffer.length);
  });
});
