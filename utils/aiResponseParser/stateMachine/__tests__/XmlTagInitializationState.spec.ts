import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { XmlTagInitializationState } from '../XmlTagInitializationState';
import { FileOpeningTagParsingState } from '../FileOpeningTagParsingState';
import { ToolParsingState } from '../ToolParsingState';
import { TextState } from '../TextState';
import { ParserContext } from '../ParserContext';
import { ParserStateType } from '../State';
import type { AIResponseSegment } from '../../types';
import { AgentRunState } from '~/types/agent/AgentRunState';
import type { Conversation, AIMessage } from '~/types/conversation';
import { AgentContext } from '~/types/agent/AgentContext';
import type { AgentRunConfig } from '~/types/agent/AgentRunConfig';

vi.mock('~/utils/toolUtils', () => ({
  generateBaseInvocationId: () => 'mock_id'
}));

vi.mock('~/stores/llmProviderConfig', () => ({
  useLLMProviderConfigStore: vi.fn(() => ({
    getProviderForModel: vi.fn(() => 'anthropic'),
  })),
}));

const createMockAgentContext = (segments: AIResponseSegment[], parseToolCalls: boolean): AgentContext => {
  const conversation: Conversation = { id: 'test-conv-id', messages: [], createdAt: '', updatedAt: '' };
  const lastAIMessage: AIMessage = { type: 'ai', text: '', timestamp: new Date(), chunks: [], segments, isComplete: false, parserInstance: null as any };
  conversation.messages.push(lastAIMessage);
  const agentState = new AgentRunState('test-conv-id', conversation);
  const agentConfig: AgentRunConfig = { launchProfileId: '', workspaceId: null, llmModelName: 'anthropic-model', autoExecuteTools: false, useXmlToolFormat: true, parseToolCalls };
  return new AgentContext(agentConfig, agentState);
};

describe('XmlTagInitializationState', () => {
  let segments: AIResponseSegment[];
  let context: ParserContext;

  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should transition to FileOpeningTagParsingState for known tag <file', () => {
    segments = [];
    const agentContext = createMockAgentContext(segments, true);
    context = new ParserContext(agentContext);
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
    const agentContext = createMockAgentContext(segments, true);
    context = new ParserContext(agentContext);
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
    const agentContext = createMockAgentContext(segments, false);
    context = new ParserContext(agentContext);
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
    const agentContext = createMockAgentContext(segments, true);
    context = new ParserContext(agentContext);
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
    const agentContext = createMockAgentContext(segments, true);
    context = new ParserContext(agentContext);
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
