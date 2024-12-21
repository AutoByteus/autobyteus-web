import { describe, it, expect, beforeEach } from 'vitest';
import { TagParsingState } from '../TagParsingState';
import { TextState } from '../TextState';
import { FileContentReadingState } from '../FileContentReadingState';
import { ParserContext } from '../ParserContext';
import type { AIResponseSegment } from '../../types';
import { FileClosingTagScanState } from '../FileClosingTagScanState';

describe('TagParsingState', () => {
  let segments: AIResponseSegment[];
  let context: ParserContext;

  beforeEach(() => {
    segments = [];
    context = new ParserContext(segments);
    // Initialize the tagBuffer with the start of a tag (e.g., '<bash' or '<file')
    // Depending on the test case, this will be overridden
    context.currentSegment = null;
  });

  it('should parse a complete bash tag and add a bash_command segment', () => {
    // Initialize the tagBuffer with '<bash'
    context.tagBuffer = '<bash';
    context.currentState = new TagParsingState(context);
    // Provide the rest of the tag after '<bash'
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
    // Initialize the tagBuffer with '<file'
    context.tagBuffer = '<file';
    context.currentState = new TagParsingState(context);
    // Provide the rest of the tag after '<file'
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
    expect(context.currentState).toBeInstanceOf(FileClosingTagScanState);
  });

  it('should revert to TextState if tag no longer matches `<bash` or `<file`', () => {
    // Initialize the tagBuffer with '<baXYZ'
    context.tagBuffer = '<baXYZ';
    context.currentState = new TagParsingState(context);
    // Provide the rest of the tag after '<baXYZ'
    context.buffer = ' Something else';
    context.pos = 0;

    // First run: Attempt to parse the tag, fail, and revert to TextState
    context.currentState.run();

    // Second run: Process the remaining text
    context.currentState.run();

    expect(segments).toEqual([
      { type: 'text', content: '<baXYZ Something else' }
    ]);
    expect(context.currentState).toBeInstanceOf(TextState);
  });

  it('should handle partial bash tag without closing and wait for more data', () => {
    // Initialize the tagBuffer with '<bash'
    context.tagBuffer = '<bash';
    context.currentState = new TagParsingState(context);
    // Provide a partial tag
    context.buffer = ' command="ech';
    context.pos = 0;

    // First run: Attempt to parse the incomplete bash tag
    context.currentState.run();

    // No complete tag yet, still waiting
    expect(segments).toEqual([]);
    expect(context.currentState.stateType).toBe('TAG_PARSING_STATE');

    // Provide the remaining part of the tag
    context.buffer += 'o Hello" description="Print Hello"/>';

    // Second run: Parse the complete bash tag
    context.currentState.run();

    // Third run: Process any trailing text (none in this case)
    context.currentState.run();

    expect(segments).toEqual([
      { type: 'bash_command', command: 'echo Hello', description: 'Print Hello' }
    ]);
    expect(context.currentState).toBeInstanceOf(TextState);
  });
});