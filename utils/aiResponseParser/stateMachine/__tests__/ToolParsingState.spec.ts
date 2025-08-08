import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { ToolParsingState } from '../ToolParsingState';
import { TextState } from '../TextState';
import { ParserContext } from '../ParserContext';
import type { AIResponseSegment } from '../../types';
import type { ToolParsingStrategy, SignatureMatch } from '../../tool_parsing_strategies/base';
import { AgentRunState } from '~/types/agent/AgentRunState';
import type { Conversation, AIMessage } from '~/types/conversation';
import { AgentContext } from '~/types/agent/AgentContext';
import type { AgentRunConfig } from '~/types/agent/AgentRunConfig';

// Mock the tool utils to prevent the sha256 error and make tests predictable.
vi.mock('~/utils/toolUtils', () => ({
  generateBaseInvocationId: (toolName: string, args: Record<string, any>): string => {
    const argString = JSON.stringify(args);
    return `call_base_${toolName}_${argString}`;
  }
}));

vi.mock('~/stores/llmProviderConfig', () => ({
  useLLMProviderConfigStore: vi.fn(() => ({
    getProviderForModel: vi.fn(() => 'default'),
  })),
}));

// A simple mock strategy for precise control over the state's behavior
class MockToolStrategy implements ToolParsingStrategy {
  signature = '{';
  private complete = false;
  public startSegmentCalled = false;
  public processCharCalledWith: string[] = [];
  public finalizeCalled = false;

  checkSignature(buffer: string): SignatureMatch {
    return buffer.startsWith(this.signature) ? 'match' : 'no_match';
  }
  startSegment(context: ParserContext, signatureBuffer: string): void {
    this.startSegmentCalled = true;
    context.startJsonToolCallSegment(); // Simulate creating a segment
  }
  processChar(char: string, context: ParserContext): void {
    this.processCharCalledWith.push(char);
    if (char === ';') {
      this.complete = true;
    }
  }
  finalize(context: ParserContext): void {
    this.finalizeCalled = true;
    context.finalizeJsonSegment([{ name: 'mock_tool', arguments: {} }]);
  }
  isComplete(): boolean {
    return this.complete;
  }
}

const createMockAgentContext = (segments: AIResponseSegment[]): AgentContext => {
  const conversation: Conversation = { id: 'test-conv-id', messages: [], createdAt: '', updatedAt: '' };
  const lastAIMessage: AIMessage = { type: 'ai', text: '', timestamp: new Date(), chunks: [], segments, isComplete: false, parserInstance: null as any };
  conversation.messages.push(lastAIMessage);
  const agentState = new AgentRunState('test-conv-id', conversation);
  const agentConfig: AgentRunConfig = { launchProfileId: '', workspaceId: null, llmModelIdentifier: 'test-model', autoExecuteTools: false, parseToolCalls: true };
  return new AgentContext(agentConfig, agentState);
};

describe('ToolParsingState', () => {
  let segments: AIResponseSegment[];
  let context: ParserContext;
  let mockStrategy: MockToolStrategy;
  let state: ToolParsingState;

  beforeEach(() => {
    setActivePinia(createPinia());
    segments = [];
    mockStrategy = new MockToolStrategy();
    const agentContext = createMockAgentContext(segments);
    context = new ParserContext(agentContext);
    // @ts-ignore - Manually setting strategy for this test
    context.strategy = mockStrategy;
    vi.clearAllMocks();
  });

  it('should call strategy.startSegment upon construction and advance context', () => {
    context.buffer = '{';
    context.pos = 0;
    state = new ToolParsingState(context, '{');
    expect(mockStrategy.startSegmentCalled).toBe(true);
    expect(segments[0]?.type).toBe('tool_call');
    expect(context.pos).toBe(1);
  });

  it('should loop and call processChar for each character until the strategy is complete', () => {
    context.buffer = '{abc;def';
    context.pos = 0; 
    
    state = new ToolParsingState(context, '{');
    state.run();

    expect(mockStrategy.processCharCalledWith).toEqual(['a', 'b', 'c', ';']);
    expect(mockStrategy.finalizeCalled).toBe(true);
    expect(context.currentState).toBeInstanceOf(TextState);
  });

  it('should leave remaining characters in the buffer for the next state', () => {
    context.buffer = '{abc;def';
    context.pos = 0;
    state = new ToolParsingState(context, '{');

    state.run();

    expect(context.pos).toBe(5);
    expect(context.buffer.substring(context.pos)).toBe('def');
  });
  
  it('should handle when the strategy is completed by the signature buffer alone', () => {
    mockStrategy.isComplete = () => true;

    context.buffer = ';more-text';
    context.pos = 0;
    
    state = new ToolParsingState(context, ';');
    state.run();
    
    expect(mockStrategy.processCharCalledWith).toEqual([]);
    expect(mockStrategy.finalizeCalled).toBe(true);
    expect(context.currentState).toBeInstanceOf(TextState);
    expect(context.pos).toBe(1); 
    expect(context.buffer.substring(context.pos)).toBe('more-text');
  });
});
