import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JsonInitializationState } from '../JsonInitializationState';
import { TextState } from '../TextState';
import { ToolParsingState } from '../ToolParsingState';
import { ParserContext } from '../ParserContext';
import { ParserStateType } from '../State';
import type { AIResponseSegment } from '../../types';
import { OpenAiStreamingStrategy } from '../../streaming_strategies/openai_strategy';

vi.mock('~/utils/toolUtils', () => ({
  generateInvocationId: () => 'mock_id'
}));

describe('JsonInitializationState', () => {
  let segments: AIResponseSegment[];
  let context: ParserContext;
  let strategy: OpenAiStreamingStrategy;

  beforeEach(() => {
    segments = [];
    strategy = new OpenAiStreamingStrategy();
    // In tests, we'll explicitly set useXml as needed.
  });

  it('should transition to ToolParsingState on a matching signature', () => {
    context = new ParserContext(segments, strategy, false);
    context.buffer = '{"tool_calls": [{}]}';
    context.pos = 0;
    context.currentState = new JsonInitializationState(context);
    context.currentState.run();
    expect(context.currentState.stateType).toBe(ParserStateType.TOOL_PARSING_STATE);
  });

  it('should transition back to TextState if signature does not match', () => {
    context = new ParserContext(segments, strategy, false);
    context.buffer = '{"not_a_tool": "value"}';
    context.pos = 0;
    context.currentState = new JsonInitializationState(context);
    context.currentState.run();

    expect(context.currentState.stateType).toBe(ParserStateType.TEXT_STATE);
    // Run the text state to process the buffer
    context.currentState.run();
    expect(segments).toEqual([{ type: 'text', content: '{"not_a_tool": "value"}' }]);
  });

  it('should revert to TextState if useXml is true', () => {
    context = new ParserContext(segments, strategy, true);
    context.buffer = '{"tool_calls": [{}]}'; // a valid JSON tool signature
    context.pos = 0;
    context.currentState = new JsonInitializationState(context);
    context.currentState.run();

    expect(context.currentState.stateType).toBe(ParserStateType.TEXT_STATE);
    context.currentState.run();
    expect(segments).toEqual([{ type: 'text', content: '{"tool_calls": [{}]}' }]);
  });

  it('should wait for more characters for a partial match', () => {
    context = new ParserContext(segments, strategy, false);
    context.buffer = '{"tool_c';
    context.pos = 0;
    context.currentState = new JsonInitializationState(context);
    context.currentState.run();

    expect(context.currentState.stateType).toBe(ParserStateType.JSON_INITIALIZATION_STATE);
    expect(context.pos).toBe(context.buffer.length);
  });
});
