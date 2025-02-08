import { describe, it, expect, beforeEach } from 'vitest';
import { ThinkContentReadingState } from '../ThinkContentReadingState';
import { ThinkClosingTagScanState } from '../ThinkClosingTagScanState';
import { ParserContext } from '../ParserContext';
import type { AIResponseSegment } from '../../types';

describe('ThinkContentReadingState', () => {
  let segments: AIResponseSegment[];
  let context: ParserContext;

  beforeEach(() => {
    segments = [];
    context = new ParserContext(segments);
    // Initialize a think segment so that the parser has a current segment of type 'think'
    context.startThinkSegment();
    // Set the current state to ThinkContentReadingState
    context.currentState = new ThinkContentReadingState(context);
  });

  it('should skip an initial newline if present and append subsequent characters', () => {
    context.buffer = '\nFirst line of thinking';
    context.pos = 0;
    context.currentState.run();

    // Expect that the initial newline is skipped and the remaining text is appended
    expect(segments).toEqual([
      { type: 'think', content: 'First line of thinking' }
    ]);
    // Since no "<" is encountered, the state remains THINK_CONTENT_READING_STATE
    expect(context.currentState.stateType).toBe('THINK_CONTENT_READING_STATE');
  });

  it('should append characters until "<" is encountered and transition to ThinkClosingTagScanState', () => {
    context.buffer = 'Partial think text<';
    context.pos = 0;
    context.currentState.run();

    // The think segment should contain the text up to (but not including) '<'
    expect(segments).toEqual([
      { type: 'think', content: 'Partial think text' }
    ]);
    // After encountering '<', the state should transition to ThinkClosingTagScanState
    expect(context.currentState).toBeInstanceOf(ThinkClosingTagScanState);
  });

  it('should append entire buffer to think segment if no "<" is encountered', () => {
    context.buffer = 'Complete thinking without tag';
    context.pos = 0;
    context.currentState.run();

    // All content should be appended to the think segment
    expect(segments).toEqual([
      { type: 'think', content: 'Complete thinking without tag' }
    ]);
    // The state remains in THINK_CONTENT_READING_STATE since no transition occurred
    expect(context.currentState.stateType).toBe('THINK_CONTENT_READING_STATE');
  });

  it('should handle an empty buffer gracefully', () => {
    context.buffer = '';
    context.pos = 0;
    context.currentState.run();

    // With an empty buffer, the think segment remains unchanged
    expect(segments).toEqual([
      { type: 'think', content: '' }
    ]);
    expect(context.currentState.stateType).toBe('THINK_CONTENT_READING_STATE');
  });
});