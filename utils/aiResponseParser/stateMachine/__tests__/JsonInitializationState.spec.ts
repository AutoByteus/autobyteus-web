import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JsonInitializationState } from '../JsonInitializationState';
import { TextState } from '../TextState';
import { ToolParsingState } from '../ToolParsingState';
import { ParserContext } from '../ParserContext';
import { ParserStateType } from '../State';
import type { AIResponseSegment } from '../../types';
import { OpenAiToolParsingStrategy } from '../../tool_parsing_strategies/openAiToolParsingStrategy';

vi.mock('~/utils/toolUtils', () => ({
  generateInvocationId: () => 'mock_id'
}));

describe('JsonInitializationState', () => {
  let segments: AIResponseSegment[];
  let context: ParserContext;
  let strategy: OpenAiToolParsingStrategy;

  beforeEach(() => {
    segments = [];
    strategy = new OpenAiToolParsingStrategy();
    // In tests, we'll explicitly set useXml as needed.
  });

  it('should transition to ToolParsingState on a matching signature when parsing is enabled', () => {
    context = new ParserContext(segments, strategy, false, true); // parsing enabled
    context.buffer = '{"tool_calls": [{}]}';
    context.pos = 0;
    context.currentState = new JsonInitializationState(context);
    context.currentState.run();
    expect(context.currentState.stateType).toBe(ParserStateType.TOOL_PARSING_STATE);
  });

  it('should transition back to TextState if signature does not match', () => {
    context = new ParserContext(segments, strategy, false, true);
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
    context = new ParserContext(segments, strategy, false, false); // parsing disabled
    context.buffer = '{"tool_calls": [{}]}'; // a valid JSON tool signature
    context.pos = 0;
    context.currentState = new JsonInitializationState(context);
    context.currentState.run();

    expect(context.currentState.stateType).toBe(ParserStateType.TEXT_STATE);
    context.currentState.run();
    expect(segments).toEqual([{ type: 'text', content: '{"tool_calls": [{}]}' }]);
  });

  it('should wait for more characters for a partial match', () => {
    context = new ParserContext(segments, strategy, false, true);
    context.buffer = '{"tool_c';
    context.pos = 0;
    context.currentState = new JsonInitializationState(context);
    context.currentState.run();

    expect(context.currentState.stateType).toBe(ParserStateType.JSON_INITIALIZATION_STATE);
    expect(context.pos).toBe(context.buffer.length);
  });
});