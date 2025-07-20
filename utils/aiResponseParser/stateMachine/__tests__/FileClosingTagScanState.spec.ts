import { describe, it, expect, beforeEach } from 'vitest';
import { FileClosingTagScanState } from '../FileClosingTagScanState';
import { FileContentReadingState } from '../FileContentReadingState';
import { TextState } from '../TextState';
import { ParserContext } from '../ParserContext';
import type { AIResponseSegment } from '../../types';
import { DefaultJsonToolParsingStrategy } from '../../tool_parsing_strategies/defaultJsonToolParsingStrategy';
import { AgentInstanceContext } from '~/types/agentInstanceContext';

describe('FileClosingTagScanState', () => {
  let segments: AIResponseSegment[];
  let context: ParserContext;
  let agentContext: AgentInstanceContext;

  beforeEach(() => {
    segments = [];
    agentContext = new AgentInstanceContext('test-conv-id');
    context = new ParserContext(segments, new DefaultJsonToolParsingStrategy(), false, true, agentContext);
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
