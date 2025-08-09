import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { XmlTagInitializationState } from '../XmlTagInitializationState';
import { FileParsingState } from '../FileParsingState';
import { ToolParsingState } from '../ToolParsingState';
import { TextState } from '../TextState';
import { ParserContext } from '../ParserContext';
import { ParserStateType } from '../State';
import type { AIResponseSegment } from '../../types';
import { AgentRunState } from '~/types/agent/AgentRunState';
import type { Conversation, AIMessage } from '~/types/conversation';
import { AgentContext } from '~/types/agent/AgentContext';
import type { AgentRunConfig } from '~/types/agent/AgentRunConfig';
import { StreamScanner } from '../StreamScanner';

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
  const agentConfig: AgentRunConfig = { launchProfileId: '', workspaceId: null, llmModelIdentifier: 'anthropic-model', autoExecuteTools: false, parseToolCalls };
  return new AgentContext(agentConfig, agentState);
};

describe('XmlTagInitializationState', () => {
  let segments: AIResponseSegment[];
  let context: ParserContext;

  function runMachine(input: string, parseToolCalls: boolean = true) {
    const agentContext = createMockAgentContext(segments, parseToolCalls);
    context = new ParserContext(agentContext);
    // @ts-ignore
    context.scanner = new StreamScanner(input);
    context.currentState = new TextState(context);
    context.currentState.run(); // Find '<' and transition to XmlTagInitializationState
    context.currentState.run(); // Run XmlTagInitializationState
  }

  beforeEach(() => {
    setActivePinia(createPinia());
    segments = [];
  });

  it('should transition to FileParsingState for known tag <file', () => {
    runMachine('<file path="test.txt">');
    expect(context.currentState.stateType).toBe(ParserStateType.FILE_PARSING_STATE);
  });
  
  it('should transition to ToolParsingState when <tool is recognized and parsing is enabled', () => {
    runMachine('<tool name="test">');
    expect(context.currentState.stateType).toBe(ParserStateType.TOOL_PARSING_STATE);
  });

  it('should revert to TextState when <tool is recognized but parsing is disabled', () => {
    runMachine('<tool name="test">', false);
    expect(context.currentState.stateType).toBe(ParserStateType.TEXT_STATE);
    context.currentState.run();
    expect(segments).toEqual([
        { type: 'text', content: '<tool name="test">' }
    ]);
  });

  it('should revert to TextState for an unrecognized tag', () => {
    runMachine('<unknown-tag>');
    expect(context.currentState.stateType).toBe(ParserStateType.TEXT_STATE);
    context.currentState.run();
    expect(segments).toEqual([
        { type: 'text', content: '<unknown-tag>' }
    ]);
  });
  
  it('should wait for more characters for a partial match', () => {
    const agentContext = createMockAgentContext(segments, true);
    context = new ParserContext(agentContext);
    // @ts-ignore
    context.scanner = new StreamScanner('<to');
    context.currentState = new TextState(context);
    context.currentState.run(); // TextState finds '<'    
    expect(context.currentState.stateType).toBe(ParserStateType.XML_TAG_INITIALIZATION_STATE);
    context.currentState.run(); // XmlTagInitializationState runs on 'to'
    expect(context.currentState.stateType).toBe(ParserStateType.XML_TAG_INITIALIZATION_STATE);
    // @ts-ignore - Check internal buffer of the state
    expect(context.currentState.tagBuffer).toBe('<to');
  });
});
