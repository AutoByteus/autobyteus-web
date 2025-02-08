import { describe, it, expect, beforeEach } from 'vitest';
import { TagParsingState } from '../TagParsingState';
import { TextState } from '../TextState';
import { FileContentReadingState } from '../FileContentReadingState';
import { ParserContext } from '../ParserContext';
import type { AIResponseSegment } from '../../types';
import { ThinkClosingTagScanState } from '../ThinkClosingTagScanState';
import { ThinkContentReadingState } from '../ThinkContentReadingState';

describe('TagParsingState', () => {
  let segments: AIResponseSegment[];
  let context: ParserContext;

  beforeEach(() => {
    segments = [];
    context = new ParserContext(segments);
    context.currentSegment = null;
  });

  it('should parse a complete bash tag and add a bash_command segment', () => {
    context.tagBuffer = '<bash';
    context.currentState = new TagParsingState(context);
    context.buffer = ' command="echo Hello" description="Print Hello"/>Some trailing text';
    context.pos = 0;

    // First run: Parse the bash tag
    context.currentState.run();

    // Second run: Process the trailing text
    context.currentState.run();

    expect(segments).toEqual([
      { type: 'bash_command', command: 'echo Hello', description: 'Print Hello' },
      { type: 'text', content: 'Some trailing text' }
    ]);
    expect(context.currentState).toBeInstanceOf(TextState);
  });

  it('should parse a file tag and transition to FileContentReadingState', () => {
    context.tagBuffer = '<file';
    context.currentState = new TagParsingState(context);
    context.buffer = ' path="src/index.js">console.log("Hello")</file>';
    context.pos = 0;

    // First run: Parse the file tag
    context.currentState.run();

    // Second run: Read the file content
    context.currentState.run();

    expect(segments).toEqual([
      {
        type: 'file',
        path: 'src/index.js',
        originalContent: 'console.log("Hello")',
        language: 'javascript'
      }
    ]);
    // For file tags, the state eventually transitions to a closing state (here tested as ThinkClosingTagScanState for similarity)
    expect(context.currentState).toBeInstanceOf(ThinkClosingTagScanState);
  });

  it('should revert to TextState if tag no longer matches `<bash` or `<file`', () => {
    context.tagBuffer = '<baXYZ';
    context.currentState = new TagParsingState(context);
    context.buffer = ' Something else';
    context.pos = 0;

    context.currentState.run();
    context.currentState.run();

    expect(segments).toEqual([
      { type: 'text', content: '<baXYZ Something else' }
    ]);
    expect(context.currentState).toBeInstanceOf(TextState);
  });

  it('should handle partial bash tag without closing and wait for more data', () => {
    context.tagBuffer = '<bash';
    context.currentState = new TagParsingState(context);
    context.buffer = ' command="ech';
    context.pos = 0;

    // First run: Incomplete tag; remains in TAG_PARSING_STATE
    context.currentState.run();

    expect(segments).toEqual([]);
    expect(context.currentState.stateType).toBe('TAG_PARSING_STATE');

    // Append the rest of the tag and run again
    context.buffer += 'o Hello" description="Print Hello"/>';
    context.currentState.run();
    context.currentState.run();

    expect(segments).toEqual([
      { type: 'bash_command', command: 'echo Hello', description: 'Print Hello' }
    ]);
    expect(context.currentState).toBeInstanceOf(TextState);
  });

  // New test for llm_reasoning_token tag parsing
  it('should parse a complete llm_reasoning_token tag and add a think segment', () => {
    context.tagBuffer = '<llm_reasoning_token';
    context.currentState = new TagParsingState(context);
    context.buffer = '>';
    context.pos = 0;

    context.currentState.run();
    // After processing, it should transition to ThinkContentReadingState
    expect(context.currentState).toBeInstanceOf(ThinkContentReadingState);
    // And a think segment should have been started in the segments array
    expect(segments).toEqual([
      { type: 'think', content: '' }
    ]);
  });
});