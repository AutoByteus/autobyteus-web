import { describe, it, expect, beforeEach } from 'vitest';
import { TextState } from '../TextState';
import { ParserContext } from '../ParserContext';
import type { AIResponseSegment } from '../../types';
import { DefaultJsonToolParsingStrategy } from '../../tool_parsing_strategies/defaultJsonToolParsingStrategy';
import { XmlTagInitializationState } from '../XmlTagInitializationState';
import { JsonInitializationState } from '../JsonInitializationState';
import { AgentInstanceContext } from '~/types/agentInstanceContext';

describe('TextState', () => {
  let segments: AIResponseSegment[];
  let context: ParserContext;
  let agentContext: AgentInstanceContext;

  beforeEach(() => {
    segments = [];
    agentContext = new AgentInstanceContext('test-conv-id');
    context = new ParserContext(segments, new DefaultJsonToolParsingStrategy(), false, true, agentContext);
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
    const disabledContext = new ParserContext(segments, new DefaultJsonToolParsingStrategy(), false, false, agentContext);
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
