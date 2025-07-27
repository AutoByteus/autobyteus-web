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

describe('XmlTagInitializationState', () => {
  let segments: AIResponseSegment[];
  let context: ParserContext;
  let agentRunState: AgentRunState;

  it('should transition to FileOpeningTagParsingState for known tag <file', () => {
    segments = [];
    const mockConversation = createMockConversation('test-conv-id');
    agentRunState = new AgentRunState('test-conv-id', mockConversation);
    context = new ParserContext(segments, new DefaultJsonToolParsingStrategy(), true, true, agentRunState);
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
    const mockConversation = createMockConversation('test-conv-id');
    agentRunState = new AgentRunState('test-conv-id', mockConversation);
    context = new ParserContext(segments, new XmlToolParsingStrategy(), true, true, agentRunState);
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
    const mockConversation = createMockConversation('test-conv-id');
    agentRunState = new AgentRunState('test-conv-id', mockConversation);
    context = new ParserContext(segments, new XmlToolParsingStrategy(), true, false, agentRunState); // parsing disabled
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
    const mockConversation = createMockConversation('test-conv-id');
    agentRunState = new AgentRunState('test-conv-id', mockConversation);
    context = new ParserContext(segments, new DefaultJsonToolParsingStrategy(), true, true, agentRunState);
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
    const mockConversation = createMockConversation('test-conv-id');
    agentRunState = new AgentRunState('test-conv-id', mockConversation);
    context = new ParserContext(segments, new XmlToolParsingStrategy(), true, true, agentRunState);
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
