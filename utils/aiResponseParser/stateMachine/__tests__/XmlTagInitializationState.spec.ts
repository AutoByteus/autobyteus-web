import { describe, it, expect, beforeEach, vi } from 'vitest';
import { XmlTagInitializationState } from '../XmlTagInitializationState';
import { FileOpeningTagParsingState } from '../FileOpeningTagParsingState';
import { ToolParsingState } from '../ToolParsingState';
import { TextState } from '../TextState';
import { ParserContext } from '../ParserContext';
import { ParserStateType } from '../State';
import type { AIResponseSegment } from '../../types';
import { XmlToolParsingStrategy } from '../../tool_parsing_strategies/xmlToolParsingStrategy';
import { DefaultJsonToolParsingStrategy } from '../../tool_parsing_strategies/defaultJsonToolParsingStrategy';

vi.mock('~/utils/toolUtils', () => ({
  generateInvocationId: () => 'mock_id'
}));

describe('XmlTagInitializationState', () => {
  let segments: AIResponseSegment[];
  let context: ParserContext;

  it('should transition to FileOpeningTagParsingState for known tag <file', () => {
    segments = [];
    context = new ParserContext(segments, new DefaultJsonToolParsingStrategy(), true, true);
    context.buffer = '<file path="test.txt">';
    context.pos = 0;
    context.currentState = new TextState(context); // Start from TextState
    context.currentState.run(); // TextState sees '<' and transitions
    
    expect(context.currentState.stateType).toBe(ParserStateType.XML_TAG_INITIALIZATION_STATE);
    context.currentState.run(); // XmlTagInitializationState runs
    expect(context.currentState.stateType).toBe(ParserStateType.FILE_OPENING_TAG_PARSING_STATE);
  });
  
  it('should transition to ToolParsingState when <tool is recognized and parsing is enabled', () => {
    segments = [];
    context = new ParserContext(segments, new XmlToolParsingStrategy(), true, true); // parsing enabled
    context.buffer = '<tool name="test">';
    context.pos = 0;
    context.currentState = new TextState(context);
    context.currentState.run();

    expect(context.currentState.stateType).toBe(ParserStateType.XML_TAG_INITIALIZATION_STATE);
    context.currentState.run();
    expect(context.currentState.stateType).toBe(ParserStateType.TOOL_PARSING_STATE);
  });

  it('should revert to TextState when <tool is recognized but parsing is disabled', () => {
    segments = [];
    context = new ParserContext(segments, new XmlToolParsingStrategy(), true, false); // parsing disabled
    context.buffer = '<tool name="test">';
    context.pos = 0;
    context.currentState = new TextState(context);
    context.currentState.run(); // TextState transitions to XmlTagInitializationState

    expect(context.currentState.stateType).toBe(ParserStateType.XML_TAG_INITIALIZATION_STATE);
    context.currentState.run(); // XmlTagInitializationState sees <tool but reverts due to flag
    expect(context.currentState.stateType).toBe(ParserStateType.TEXT_STATE);
    
    context.currentState.run(); // Process the rest of the buffer
    expect(segments).toEqual([
        { type: 'text', content: '<tool name="test">' }
    ]);
  });

  it('should revert to TextState for an unrecognized tag', () => {
    segments = [];
    context = new ParserContext(segments, new DefaultJsonToolParsingStrategy(), true, true);
    context.buffer = '<unknown-tag>';
    context.pos = 0;
    context.currentState = new TextState(context);
    context.currentState.run();
    
    expect(context.currentState.stateType).toBe(ParserStateType.XML_TAG_INITIALIZATION_STATE);
    context.currentState.run(); // This should revert to text state
    expect(context.currentState.stateType).toBe(ParserStateType.TEXT_STATE);
    
    context.currentState.run(); // Process the rest of the buffer
    expect(segments).toEqual([
        { type: 'text', content: '<unknown-tag>' }
    ]);
  });
  
  it('should wait for more characters for a partial match', () => {
    segments = [];
    context = new ParserContext(segments, new XmlToolParsingStrategy(), true, true);
    context.buffer = '<to';
    context.pos = 0;
    context.currentState = new TextState(context);
    context.currentState.run();

    expect(context.currentState.stateType).toBe(ParserStateType.XML_TAG_INITIALIZATION_STATE);
    context.currentState.run(); // Run the init state
    expect(context.currentState.stateType).toBe(ParserStateType.XML_TAG_INITIALIZATION_STATE);
    expect(context.tagBuffer).toBe('<to');
  });
});