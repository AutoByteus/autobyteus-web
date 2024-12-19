import { describe, it, expect, beforeEach } from 'vitest';
import { TextState } from '../TextState';
import { ParserContext } from '../ParserContext';
import type { AIResponseSegment } from '../../types';

describe('TextState', () => {
  let segments: AIResponseSegment[];
  let context: ParserContext;

  beforeEach(() => {
    segments = [];
    context = new ParserContext(segments);
    context.buffer = 'Hello World';
    context.currentState = new TextState(context);
  });

  it('should append text characters to a text segment', () => {
    context.currentState.run();
    expect(segments).toEqual([
      { type: 'text', content: 'Hello World' }
    ]);
  });

  it('should transition to TagInitializationState when `<` encountered', () => {
    context.buffer = 'Hello <file path="test.txt">';
    context.pos = 0;
    context.currentState = new TextState(context);
    context.currentState.run();

    // 'Hello ' should be parsed as text
    expect(segments).toEqual([
      { type: 'text', content: 'Hello ' }
    ]);
    // Current state should now be TagInitializationState after encountering `<`
    expect(context.currentState.stateType).toEqual('TAG_INITIALIZATION_STATE');
  });

  it('should handle empty buffer without errors', () => {
    context.buffer = '';
    context.pos = 0;
    context.currentState = new TextState(context);
    context.currentState.run();
    expect(segments).toEqual([]);
  });

  it('should handle whitespace-only text', () => {
    context.buffer = '   \n\t  ';
    context.pos = 0;
    context.currentState = new TextState(context);
    context.currentState.run();
    expect(segments).toEqual([
      { type: 'text', content: '   \n\t  ' }
    ]);
  });
});