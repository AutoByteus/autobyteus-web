import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FileOpeningTagParsingState } from '../FileOpeningTagParsingState';
import { TextState } from '../TextState';
import { FileContentReadingState } from '../FileContentReadingState';
import { ParserContext } from '../ParserContext';
import { ParserStateType } from '../State';
import type { AIResponseSegment } from '../../types';
import { DefaultJsonToolParsingStrategy } from '../../tool_parsing_strategies/defaultJsonToolParsingStrategy';

vi.mock('~/utils/toolUtils', () => ({
  generateInvocationId: () => 'mock_id'
}));

describe('FileOpeningTagParsingState', () => {
  let segments: AIResponseSegment[];
  let context: ParserContext;

  beforeEach(() => {
    segments = [];
    context = new ParserContext(segments, new DefaultJsonToolParsingStrategy(), false);
  });
  
  it('should parse an opening <file...> tag and transition to FileContentReadingState', () => {
    context.buffer = '<file path="a.txt">';
    context.pos = 0;
    
    // Start the machine
    context.currentState = new TextState(context);
    context.currentState.run(); // TextState finds '<', transitions to XmlTagInitializationState

    // Let the machine continue from its current state
    expect(context.currentState.stateType).toBe(ParserStateType.XML_TAG_INITIALIZATION_STATE);
    context.currentState.run(); // XmlTagInitializationState finds '<file', transitions to FileOpeningTagParsingState
    
    expect(context.currentState.stateType).toBe(ParserStateType.FILE_OPENING_TAG_PARSING_STATE);
    context.currentState.run(); // FileOpeningTagParsingState finds '>', transitions to FileContentReadingState
    
    expect(segments.length).toBe(1);
    expect(segments[0].type).toBe('file');
    expect((segments[0] as any).path).toBe('a.txt');
    expect(context.currentState.stateType).toBe(ParserStateType.FILE_CONTENT_READING_STATE);
  });

  it('should handle a malformed <file> tag (no path) by treating it as text', () => {
    context.buffer = '<file>';
    context.pos = 0;
    
    // Start the machine
    context.currentState = new TextState(context);
    context.currentState.run(); // TextState finds '<', transitions to XmlTagInitializationState

    // Let the machine continue
    expect(context.currentState.stateType).toBe(ParserStateType.XML_TAG_INITIALIZATION_STATE);
    context.currentState.run(); // XmlTagInitializationState finds '<file', transitions to FileOpeningTagParsingState

    expect(context.currentState.stateType).toBe(ParserStateType.FILE_OPENING_TAG_PARSING_STATE);
    context.currentState.run(); // FileOpeningTagParsingState sees '>', finds no path, transitions to TextState

    expect(segments[0]).toEqual({ type: 'text', content: '<file>' });
    expect(context.currentState.stateType).toBe(ParserStateType.TEXT_STATE);
  });
});