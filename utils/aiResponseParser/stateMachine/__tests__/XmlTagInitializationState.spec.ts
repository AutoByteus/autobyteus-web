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
import { StateMachine } from '../StateMachine';

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
  const agentConfig: AgentRunConfig = { launchProfileId: '', workspaceId: null, llmModelIdentifier: 'anthropic-model', autoExecuteTools: false, parseToolCalls, useXmlToolFormat: true };
  return new AgentContext(agentConfig, agentState);
};

describe('XmlTagInitializationState', () => {
  let segments: AIResponseSegment[];
  let context: ParserContext;

  function runMachine(input: string, parseToolCalls: boolean = true): ParserContext {
    const agentContext = createMockAgentContext(segments, parseToolCalls);
    const machineContext = new ParserContext(agentContext);
    const machine = new StateMachine(machineContext);
    machine.appendChunks([input]);
    machine.run();
    return machineContext;
  }

  beforeEach(() => {
    setActivePinia(createPinia());
    segments = [];
  });

  it('should transition to FileParsingState for known tag <file', () => {
    context = runMachine('pre-text <file path="test.txt">');
    // After running, the state machine would be in FileParsingState waiting for more input.
    expect(context.currentState.stateType).toBe(ParserStateType.FILE_PARSING_STATE);
  });
  
  it('should transition to ToolParsingState for a <tool name="FileWriter"> tag', () => {
    context = runMachine('<tool name="FileWriter">');
    expect(context.currentState.stateType).toBe(ParserStateType.TOOL_PARSING_STATE);
  });

  it('should transition to ToolParsingState for a generic <tool> tag when parsing is enabled', () => {
    context = runMachine('<tool name="GenericTool">');
    expect(context.currentState.stateType).toBe(ParserStateType.TOOL_PARSING_STATE);
  });

  it('should revert to TextState when a generic <tool> tag is found but parsing is disabled', () => {
    context = runMachine('<tool name="GenericTool">', false);
    expect(context.currentState.stateType).toBe(ParserStateType.TEXT_STATE);
    // The finalize step will commit the buffer to a text segment
    context.currentState.finalize();
    expect(segments).toEqual([
        { type: 'text', content: '<tool name="GenericTool">' }
    ]);
  });

  it('should revert to TextState for an unrecognized tag', () => {
    context = runMachine('<unknown-tag>');
    context.currentState.finalize();
    expect(context.currentState.stateType).toBe(ParserStateType.TEXT_STATE);
    expect(segments).toEqual([
        { type: 'text', content: '<unknown-tag>' }
    ]);
  });
  
  it('should wait for more characters for a partial match and finalize to text', () => {
    context = runMachine('<to');
    // The machine runs out of characters while in XmlTagInitializationState
    expect(context.currentState.stateType).toBe(ParserStateType.XML_TAG_INITIALIZATION_STATE);
    
    // Finalizing should revert the partial tag to text
    context.currentState.finalize();
    expect(segments).toEqual([
      { type: 'text', content: '<to' }
    ]);
  });

  it('should correctly identify a tool tag even with different spacing and quotes', () => {
    context = runMachine(`<tool name='MyTool' >`);
    expect(context.currentState.stateType).toBe(ParserStateType.TOOL_PARSING_STATE);
  });

  it('should revert a tag that looks like a tool but is not, to text', () => {
    context = runMachine('<tooltip>This is a tooltip</tooltip>');
    context.currentState.finalize();
    expect(segments).toEqual([
        { type: 'text', content: '<tooltip>This is a tooltip</tooltip>' }
    ]);
  });
});