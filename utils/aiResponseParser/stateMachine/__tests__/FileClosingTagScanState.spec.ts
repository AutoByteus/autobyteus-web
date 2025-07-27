import { describe, it, expect, beforeEach } from 'vitest';
import { FileClosingTagScanState } from '../FileClosingTagScanState';
import { FileContentReadingState } from '../FileContentReadingState';
import { TextState } from '../TextState';
import { ParserContext } from '../ParserContext';
import type { AIResponseSegment } from '../../types';
import { DefaultJsonToolParsingStrategy } from '../../tool_parsing_strategies/defaultJsonToolParsingStrategy';
import { AgentRunState } from '~/types/agent/AgentRunState';
import type { Conversation } from '~/types/conversation';

const createMockConversation = (id: string): Conversation => ({
  id,
  messages: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

describe('FileClosingTagScanState', () => {
  let segments: AIResponseSegment[];
  let context: ParserContext;
  let agentRunState: AgentRunState;

  beforeEach(() => {
    segments = [];
    const mockConversation = createMockConversation('test-conv-id');
    agentRunState = new AgentRunState('test-conv-id', mockConversation);
    context = new ParserContext(segments, new DefaultJsonToolParsingStrategy(), false, true, agentRunState);
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
