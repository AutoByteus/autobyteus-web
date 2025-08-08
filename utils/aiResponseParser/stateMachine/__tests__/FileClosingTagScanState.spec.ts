import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { FileClosingTagScanState } from '../FileClosingTagScanState';
import { FileContentReadingState } from '../FileContentReadingState';
import { TextState } from '../TextState';
import { ParserContext } from '../ParserContext';
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

describe('FileClosingTagScanState', () => {
  let segments: AIResponseSegment[];
  let context: ParserContext;

  beforeEach(() => {
    setActivePinia(createPinia());
    segments = [];
    const agentContext = createMockAgentContext(segments);
    context = new ParserContext(agentContext);
    context.startFileSegment('src/components/App.vue');
    context.currentState = new FileClosingTagScanState(context);
  });

  it('should detect the closing tag and end the file segment', () => {
    // Set up the tag buffer with '<' before the buffer
    context.fileClosingBuffer = '<';
    context.buffer = '/file>';
    context.pos = 0;
    context.currentState.run();

    expect(segments).toEqual([
      {
        type: 'file',
        path: 'src/components/App.vue',
        originalContent: '',
        language: 'vue'
      },
    ]);
    expect(context.currentState).toBeInstanceOf(TextState);
  });

  it('should revert to FileContentReadingState if not a closing tag', () => {
    // Set up the tag buffer with '<' before the buffer
    context.fileClosingBuffer = '<';
    context.buffer = 'notclosingtag console.log("still file content")';
    context.pos = 0;
    context.currentState.run();

    // Call run again to process the remaining buffer
    context.currentState.run();

    expect(segments).toEqual([
      {
        type: 'file',
        path: 'src/components/App.vue',
        originalContent: '<notclosingtag console.log("still file content")',
        language: 'vue'
      },
    ]);
    expect(context.currentState).toBeInstanceOf(FileContentReadingState);
  });

  it('should handle partial matches and wait for more data', () => {
    // Set up the tag buffer with '<' before the buffer
    context.fileClosingBuffer = '<';
    context.buffer = '/fi';
    context.pos = 0;
    context.currentState.run();
    // Still possible closing tag
    expect(context.currentState.stateType).toBe('FILE_CLOSING_TAG_SCAN_STATE');
    expect(segments).toEqual([
      {
        type: 'file',
        path: 'src/components/App.vue',
        originalContent: '',
        language: 'vue'
      },
    ]);
  });
});
