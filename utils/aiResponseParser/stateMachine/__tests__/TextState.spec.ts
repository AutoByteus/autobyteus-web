import { describe, it, expect, beforeEach } from 'vitest';
import { TextState } from '../TextState';
import { ParserContext } from '../ParserContext';
import type { AIResponseSegment } from '../../types';
import { DefaultJsonStreamingStrategy } from '../../streaming_strategies/default_json_strategy';
import { XmlTagInitializationState } from '../XmlTagInitializationState';
import { JsonInitializationState } from '../JsonInitializationState';

describe('TextState', () => {
  let segments: AIResponseSegment[];
  let context: ParserContext;

  beforeEach(() => {
    segments = [];
    context = new ParserContext(segments, new DefaultJsonStreamingStrategy(), false);
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
