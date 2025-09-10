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

describe('IframeParsingState', () => {
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

  it('should parse a complete, valid HTML document and transition back to TextState', () => {
    const htmlDoc = '<!doctype html><html><body>Hello World</body></html>';
    const remainingText = '...more text';
    const input = `${htmlDoc}${remainingText}`;
    
    machine.appendChunks([input]);
    machine.run();
    machine.finalize();

    expect(segments.length).toBe(2);
    
    const iframeSegment = segments[0] as IframeSegment;
    expect(iframeSegment.type).toBe('iframe');
    expect(iframeSegment.content).toBe(htmlDoc);
    
    expect(segments[1]).toEqual({ type: 'text', content: remainingText });
    
    // Check that the state machine has returned to TextState
    expect(context.currentState).toBeInstanceOf(TextState);
  });

  it('should revert to a text segment if the stream ends before </html> is found', () => {
    const incompleteHtml = '<!doctype html><html><body>Hello';
    
    machine.appendChunks([incompleteHtml]);
    machine.run();
    machine.finalize(); // Finalize is crucial here

    expect(segments.length).toBe(1);
    expect(segments[0]).toEqual({
      type: 'text',
      content: incompleteHtml,
    });
  });

  it('should handle case-insensitive doctype and html tags', () => {
    const htmlDoc = '<!DOCTYPE HTML><HTML><HEAD></HEAD><BODY>Case Insensitive</BODY></HTML>';
    
    machine.appendChunks([htmlDoc]);
    machine.run();
    machine.finalize();

    expect(segments.length).toBe(1);
    const iframeSegment = segments[0] as IframeSegment;
    expect(iframeSegment.type).toBe('iframe');
    expect(iframeSegment.content).toBe(htmlDoc);
  });

  it('should revert to text if <html> tag does not follow the doctype', () => {
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

  it('should correctly parse a complete HTML document mixed with other text', () => {
    const htmlDoc = '<!doctype html><html><body>Test</body></html>';
    const input = `Here is some text. ${htmlDoc} And here is some more text.`;
    
    machine.appendChunks([input]);
    machine.run();
    machine.finalize();

    expect(segments).toEqual([
      { type: 'text', content: 'Here is some text. ' },
      { type: 'iframe', content: htmlDoc },
      { type: 'text', content: ' And here is some more text.' },
    ]);
  });
});
