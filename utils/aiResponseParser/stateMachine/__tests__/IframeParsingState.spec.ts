import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { ParserContext } from '../ParserContext';
import type { AIResponseSegment, IframeSegment } from '../../types';
import { AgentRunState } from '~/types/agent/AgentRunState';
import type { Conversation, AIMessage } from '~/types/conversation';
import { AgentContext } from '~/types/agent/AgentContext';
import type { AgentRunConfig } from '~/types/agent/AgentRunConfig';
import { StateMachine } from '../StateMachine';
import { TextState } from '../TextState';

vi.mock('~/stores/llmProviderConfig', () => ({
  useLLMProviderConfigStore: vi.fn(() => ({ getProviderForModel: vi.fn(() => 'default') })),
}));

const createMockAgentContext = (segments: AIResponseSegment[]): AgentContext => {
  const conversation: Conversation = { id: 'test-conv-id', messages: [], createdAt: '', updatedAt: '' };
  const lastAIMessage: AIMessage = { type: 'ai', text: '', timestamp: new Date(), chunks: [], segments, isComplete: false, parserInstance: null as any };
  conversation.messages.push(lastAIMessage);
  const agentState = new AgentRunState('test-conv-id', conversation);
  const agentConfig: AgentRunConfig = { launchProfileId: '', workspaceId: null, llmModelIdentifier: 'test-model', autoExecuteTools: false, parseToolCalls: true, useXmlToolFormat: false };
  return new AgentContext(agentConfig, agentState);
};

describe('IframeParsingState (Streaming Logic)', () => {
  let segments: AIResponseSegment[];
  let context: ParserContext;
  let machine: StateMachine;

  beforeEach(() => {
    setActivePinia(createPinia());
    segments = [];
    const agentContext = createMockAgentContext(segments);
    context = new ParserContext(agentContext);
    machine = new StateMachine(context);
  });

  it('should create an incomplete iframe segment and stream content into it', () => {
    const chunk1 = '<!doctype html><html><body>';
    const chunk2 = '<p>Hello</p>';
    
    machine.appendChunks([chunk1]);
    machine.run();
    
    expect(segments.length).toBe(1);
    let iframeSegment = segments[0] as IframeSegment;
    expect(iframeSegment.type).toBe('iframe');
    expect(iframeSegment.isComplete).toBe(false);
    expect(iframeSegment.content).toBe('<!doctype html><html><body>');

    machine.appendChunks([chunk2]);
    machine.run();
    
    iframeSegment = segments[0] as IframeSegment;
    expect(iframeSegment.content).toBe('<!doctype html><html><body><p>Hello</p>');
    expect(iframeSegment.isComplete).toBe(false); // Still incomplete
  });

  it('should mark the iframe segment as complete upon receiving the closing tag', () => {
    const htmlDoc = '<!doctype html><html><body>Hello</body></html>';
    const remainingText = '...more text';
    
    machine.appendChunks([`${htmlDoc}${remainingText}`]);
    machine.run();
    machine.finalize();

    expect(segments.length).toBe(2);
    
    const iframeSegment = segments[0] as IframeSegment;
    expect(iframeSegment.type).toBe('iframe');
    expect(iframeSegment.content).toBe(htmlDoc);
    expect(iframeSegment.isComplete).toBe(true); // Should be marked as complete
    
    expect(segments[1]).toEqual({ type: 'text', content: remainingText });
    expect(context.currentState).toBeInstanceOf(TextState);
  });
  
  it('should leave the iframe segment as incomplete if the stream ends prematurely', () => {
    const incompleteHtml = '<!doctype html><html><body>Hello';
    
    machine.appendChunks([incompleteHtml]);
    machine.run();
    machine.finalize();

    expect(segments.length).toBe(1);
    const iframeSegment = segments[0] as IframeSegment;
    expect(iframeSegment.type).toBe('iframe');
    expect(iframeSegment.content).toBe(incompleteHtml);
    expect(iframeSegment.isComplete).toBe(false); // Should remain incomplete
  });

  it('should revert to text if <html> tag does not follow the doctype and stream ends', () => {
    const malformedContent = '<!doctype html>This is just some text.';
    
    machine.appendChunks([malformedContent]);
    machine.run();
    machine.finalize();

    expect(segments.length).toBe(1);
    expect(segments[0]).toEqual({
      type: 'text',
      content: malformedContent,
    });
  });
});
