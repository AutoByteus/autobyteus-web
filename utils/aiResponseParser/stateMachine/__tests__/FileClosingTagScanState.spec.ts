import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { FileClosingTagScanState } from '../FileClosingTagScanState';
import { FileContentReadingState } from '../FileContentReadingState';
import { TextState } from '../TextState';
import { ParserContext, FileParsingStatus } from '../ParserContext';
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
  const agentConfig: AgentRunConfig = { launchProfileId: '', workspaceId: null, llmModelName: 'test-model', autoExecuteTools: false, parseToolCalls: true };
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
    // REFACTOR: Set up the dedicated file parsing status object for tests.
    context.fileParsingStatus = new FileParsingStatus();
    context.fileParsingStatus.nestingLevel = 1; // Assume we are inside a file
    context.currentState = new FileClosingTagScanState(context);
  });

  it('should detect the closing tag and end the file segment when nesting level is 1', () => {
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
    expect(context.fileParsingStatus).toBeNull();
  });

  it('should treat a closing tag as content if nesting level is greater than 1', () => {
    context.fileParsingStatus!.nestingLevel = 2; // We are in a nested file
    context.fileClosingBuffer = '<';
    context.buffer = '/file>';
    context.pos = 0;
    context.currentState.run();

    // The tag is appended to content, and we are back in reading state
    expect(context.currentState).toBeInstanceOf(FileContentReadingState);
    // Nesting level is decremented
    expect(context.fileParsingStatus!.nestingLevel).toBe(1);
    // The tag is part of the content
    const fileSegment = segments[0] as any;
    expect(fileSegment.originalContent).toBe('</file>');
  });

  it('should treat a nested opening file tag as content and increment nesting level', () => {
    context.fileClosingBuffer = '<';
    context.buffer = 'file path="nested.txt">content</file>'; // Full tag in buffer
    context.pos = 0;
    context.currentState.run();

    expect(context.currentState).toBeInstanceOf(FileContentReadingState);
    // Nesting level is incremented
    expect(context.fileParsingStatus!.nestingLevel).toBe(2);
    // The tag is part of the content
    const fileSegment = segments[0] as any;
    expect(fileSegment.originalContent).toBe('<file path="nested.txt">');
    // Check that remaining buffer is processed by next state
    expect(context.buffer.substring(context.pos)).toBe('content</file>');
  });

  it('should revert to FileContentReadingState if not a file tag', () => {
    // Set up the tag buffer with '<' before the buffer
    context.fileClosingBuffer = '<';
    context.buffer = 'not-a-file-tag>';
    context.pos = 0;
    context.currentState.run();

    // The state should revert and append the buffer as content
    expect(context.currentState).toBeInstanceOf(FileContentReadingState);
    const fileSegment = segments[0] as any;
    expect(fileSegment.originalContent).toBe('<not-a-file-tag>');
  });

  it('should handle partial matches and wait for more data', () => {
    // Set up the tag buffer with '<' before the buffer
    context.fileClosingBuffer = '<';
    context.buffer = '/fi';
    context.pos = 0;
    context.currentState.run();
    // Still possible closing tag
    expect(context.currentState.stateType).toBe('FILE_CLOSING_TAG_SCAN_STATE');
    // Original segment is unchanged
    const fileSegment = segments[0] as any;
    expect(fileSegment.originalContent).toBe('');
  });
});
