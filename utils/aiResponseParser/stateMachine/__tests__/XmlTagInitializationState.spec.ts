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
import { AgentInstanceContext } from '~/types/agentInstanceContext';

vi.mock('~/utils/toolUtils', () => ({
  generateBaseInvocationId: () => 'mock_id'
}));

describe('XmlTagInitializationState', () => {
  let segments: AIResponseSegment[];
  let context: ParserContext;
  let agentContext: AgentInstanceContext;

  it('should transition to FileOpeningTagParsingState for known tag <file', () => {
    segments = [];
    agentContext = new AgentInstanceContext('test-conv-id');
    context = new ParserContext(segments, new DefaultJsonToolParsingStrategy(), true, true, agentContext);
    context.buffer = '<file path="test.txt">';
    context.pos = 0;
    context.currentState = new TextState(context);
    context.currentState.run();
    
    expect(context.currentState.stateType).toBe(ParserStateType.XML_TAG_INITIALIZATION_STATE);
    context.currentState.run();
    expect(context.currentState.stateType).toBe(ParserStateType.FILE_OPENING_TAG_PARSING_STATE);
  });
  
  it('should transition to ToolParsingState when <tool is recognized and parsing is enabled', () => {
    segments = [];
    agentContext = new AgentInstanceContext('test-conv-id');
    context = new ParserContext(segments, new XmlToolParsingStrategy(), true, true, agentContext);
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
    agentContext = new AgentInstanceContext('test-conv-id');
    context = new ParserContext(segments, new XmlToolParsingStrategy(), true, false, agentContext); // parsing disabled
    context.buffer = '<tool name="test">';
    context.pos = 0;
    context.currentState = new TextState(context);
    context.currentState.run();

    expect(context.currentState.stateType).toBe(ParserStateType.XML_TAG_INITIALIZATION_STATE);
    context.currentState.run();
    expect(context.currentState.stateType).toBe(ParserStateType.TEXT_STATE);
    
    context.currentState.run();
    expect(segments).toEqual([
        { type: 'text', content: '<tool name="test">' }
    ]);
  });

  it('should revert to TextState for an unrecognized tag', () => {
    segments = [];
    agentContext = new AgentInstanceContext('test-conv-id');
    context = new ParserContext(segments, new DefaultJsonToolParsingStrategy(), true, true, agentContext);
    context.buffer = '<unknown-tag>';
    context.pos = 0;
    context.currentState = new TextState(context);
    context.currentState.run();
    
    expect(context.currentState.stateType).toBe(ParserStateType.XML_TAG_INITIALIZATION_STATE);
    context.currentState.run();
    expect(context.currentState.stateType).toBe(ParserStateType.TEXT_STATE);
    
    context.currentState.run();
    expect(segments).toEqual([
        { type: 'text', content: '<unknown-tag>' }
    ]);
  });
  
  it('should wait for more characters for a partial match', () => {
    segments = [];
    agentContext = new AgentInstanceContext('test-conv-id');
    context = new ParserContext(segments, new XmlToolParsingStrategy(), true, true, agentContext);
    context.buffer = '<to';
    context.pos = 0;
    context.currentState = new TextState(context);
    context.currentState.run();

    expect(context.currentState.stateType).toBe(ParserStateType.XML_TAG_INITIALIZATION_STATE);
    context.currentState.run();
    expect(context.currentState.stateType).toBe(ParserStateType.XML_TAG_INITIALIZATION_STATE);
    expect(context.tagBuffer).toBe('<to');
  });
});
