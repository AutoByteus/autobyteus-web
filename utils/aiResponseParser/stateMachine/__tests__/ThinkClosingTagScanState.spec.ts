import { describe, it, expect, beforeEach } from 'vitest';
import { ThinkClosingTagScanState } from '../ThinkClosingTagScanState';
import { ThinkContentReadingState } from '../ThinkContentReadingState';
import { TextState } from '../TextState';
import { ParserContext } from '../ParserContext';
import type { AIResponseSegment } from '../../types';

describe('ThinkClosingTagScanState', () => {
  let segments: AIResponseSegment[];
  let context: ParserContext;

  beforeEach(() => {
    segments = [];
    context = new ParserContext(segments);
    // Start a think segment for testing
    context.startThinkSegment();
    context.currentState = new ThinkClosingTagScanState(context);
  });

  it('should detect the closing tag and end the think segment', () => {
    // Simulate receiving the complete closing tag in one go
    context.thinkClosingBuffer = '<';
    context.buffer = '/llm_reasoning_token>';
    context.pos = 0;
    context.currentState.run();

    expect(segments).toEqual([
      { type: 'think', content: '' }
    ]);
    expect(context.currentState).toBeInstanceOf(TextState);
  });

  it('should revert to ThinkContentReadingState if not a closing tag', () => {
    context.thinkClosingBuffer = '<';
    context.buffer = 'notclosingtag some think content';
    context.pos = 0;
    context.currentState.run();

    // The incorrect closing buffer should be appended to the think segment content
    expect(segments).toEqual([
      { type: 'think', content: '<notclosingtag some think content' }
    ]);
    expect(context.currentState).toBeInstanceOf(ThinkContentReadingState);
  });

  it('should handle partial matches and wait for more data', () => {
    context.thinkClosingBuffer = '<';
    context.buffer = '/llm_reason';
    context.pos = 0;
    context.currentState.run();

    // Still waiting for the complete closing tag
    expect(context.currentState.stateType).toBe('THINK_CLOSING_TAG_SCAN_STATE');
    expect(segments).toEqual([
      { type: 'think', content: '' }
    ]);
  });
});