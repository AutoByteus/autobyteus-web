import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JsonInitializationState } from '../JsonInitializationState';
import { TextState } from '../TextState';
import { ToolParsingState } from '../ToolParsingState';
import { ParserContext } from '../ParserContext';
import { ParserStateType } from '../State';
import type { AIResponseSegment } from '../../types';
import { OpenAiToolParsingStrategy } from '../../tool_parsing_strategies/openAiToolParsingStrategy';
import { AgentRunState } from '~/types/agent/AgentRunState';
import type { Conversation } from '~/types/conversation';

vi.mock('~/utils/toolUtils', () => ({
  generateBaseInvocationId: () => 'mock_id'
}));

const createMockConversation = (id: string): Conversation => ({
  id,
  messages: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

describe('JsonInitializationState', () => {
  let segments: AIResponseSegment[];
  let context: ParserContext;
  let strategy: OpenAiToolParsingStrategy;
  let agentRunState: AgentRunState;

  beforeEach(() => {
    segments = [];
    strategy = new OpenAiToolParsingStrategy();
    const mockConversation = createMockConversation('test-conv-id');
    agentRunState = new AgentRunState('test-conv-id', mockConversation);
  });

  it('should transition to ToolParsingState on a matching signature when parsing is enabled', () => {
    context = new ParserContext(segments, strategy, false, true, agentRunState); // parsing enabled
    context.buffer = '{"tool_calls": [{}]}';
    context.pos = 0;
    context.currentState = new JsonInitializationState(context);
    context.currentState.run();
    expect(context.currentState.stateType).toBe(ParserStateType.TOOL_PARSING_STATE);
  });

  it('should transition back to TextState if signature does not match', () => {
    context = new ParserContext(segments, strategy, false, true, agentRunState);
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
    context = new ParserContext(segments, strategy, false, false, agentRunState); // parsing disabled
    context.buffer = '{"tool_calls": [{}]}'; // a valid JSON tool signature
    context.pos = 0;
    context.currentState = new JsonInitializationState(context);
    context.currentState.run();

    expect(context.currentState.stateType).toBe(ParserStateType.TEXT_STATE);
    context.currentState.run();
    expect(segments).toEqual([{ type: 'text', content: '{"tool_calls": [{}]}' }]);
  });

  it('should wait for more characters for a partial match', () => {
    context = new ParserContext(segments, strategy, false, true, agentRunState);
    context.buffer = '{"tool_c';
    context.pos = 0;
    context.currentState = new JsonInitializationState(context);
    context.currentState.run();

    expect(context.currentState.stateType).toBe(ParserStateType.JSON_INITIALIZATION_STATE);
    expect(context.pos).toBe(context.buffer.length);
  });
});
