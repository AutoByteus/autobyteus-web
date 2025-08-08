import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { FileContentReadingState } from '../FileContentReadingState';
import { ParserContext } from '../ParserContext';
import { FileClosingTagScanState } from '../FileClosingTagScanState';
import type { AIResponseSegment } from '../../types';
import { AgentRunState } from '~/types/agent/AgentRunState';
import type { Conversation, AIMessage } from '~/types/conversation';
import { AgentContext } from '~/types/agent/AgentContext';
import type { AgentRunConfig } from '~/types/agent/AgentRunConfig';

vi.mock('~/stores/llmProviderConfig', () => ({
  useLLMProviderConfigStore: vi.fn(() => ({
    getProviderForModel: vi.fn(() => 'default'),
  })),
}));

const createMockAgentContext = (segments: AIResponseSegment[]): AgentContext => {
  const conversation: Conversation = { id: 'test-conv-id', messages: [], createdAt: '', updatedAt: '' };
  const lastAIMessage: AIMessage = { type: 'ai', text: '', timestamp: new Date(), chunks: [], segments, isComplete: false, parserInstance: null as any };
  conversation.messages.push(lastAIMessage);
  const agentState = new AgentRunState('test-conv-id', conversation);
  const agentConfig: AgentRunConfig = { launchProfileId: '', workspaceId: null, llmModelIdentifier: 'test-model', autoExecuteTools: false, parseToolCalls: true };
  return new AgentContext(agentConfig, agentState);
};

describe('FileContentReadingState', () => {
  let segments: AIResponseSegment[];
  let context: ParserContext;

  beforeEach(() => {
    setActivePinia(createPinia());
    segments = [];
    const agentContext = createMockAgentContext(segments);
    context = new ParserContext(agentContext);
    context.startFileSegment('src/app.js');
    context.currentState = new FileContentReadingState(context);
  });

  it('should append characters to file segment content until `<` encountered', () => {
    context.buffer = '\nconsole.log("Hello");<'; // Add newline to test the fix
    context.pos = 0;
    context.currentState.run();

    expect(segments).toEqual([
      {
        type: 'file',
        path: 'src/app.js',
        originalContent: 'console.log("Hello");',
        language: 'javascript'
      }
    ]);
    expect(context.currentState).toBeInstanceOf(FileClosingTagScanState);
  });

  it('should handle input with no `<` and append all to file segment', () => {
    context.buffer = 'console.log("No closing tag yet")';
    context.pos = 0;
    context.currentState.run();

    expect(segments).toEqual([
      {
        type: 'file',
        path: 'src/app.js',
        originalContent: 'console.log("No closing tag yet")',
        language: 'javascript'
      }
    ]);
    expect(context.currentState.stateType).toBe('FILE_CONTENT_READING_STATE');
  });

  it('should handle empty buffer gracefully', () => {
    context.buffer = '';
    context.pos = 0;
    context.currentState.run();
    expect(segments).toEqual([
      {
        type: 'file',
        path: 'src/app.js',
        originalContent: '',
        language: 'javascript'
      }
    ]);
    expect(context.currentState.stateType).toBe('FILE_CONTENT_READING_STATE');
  });
});
