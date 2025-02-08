import { describe, it, expect, beforeEach } from 'vitest';
import { TagInitializationState } from '../TagInitializationState';
import { TextState } from '../TextState';
import { ParserContext } from '../ParserContext';
import type { AIResponseSegment } from '../../types';

describe('TagInitializationState', () => {
  let segments: AIResponseSegment[];
  let context: ParserContext;

  beforeEach(() => {
    segments = [];
    context = new ParserContext(segments);
    // Initialize the state to TagInitializationState with tagBuffer starting with '<'
    context.tagBuffer = '<';
    context.currentState = new TagInitializationState(context);
  });

  it('should transition to TagParsingState and parse <bash tag correctly', () => {
    context.buffer = 'bash command="echo Hello"/>';
    context.pos = 0;

    // First run: TagInitializationState.run() transitions to TagParsingState
    context.currentState.run();
    expect(context.currentState.stateType).toBe('TAG_PARSING_STATE');

    // Second run: TagParsingState.run() parses the <bash> tag and adds the segment
    context.currentState.run();
    expect(context.currentState.stateType).toBe('TEXT_STATE');

    // Verify that the bash_command segment is correctly added
    expect(segments).toEqual([
      {
        type: 'bash_command',
        command: 'echo Hello',
        description: ''
      }
    ]);
  });

  it('should transition to TagParsingState when `<file` is recognized', () => {
    context.buffer = 'file path="src/index.js">';
    context.pos = 0;

    // First run: TagInitializationState.run() transitions to TagParsingState
    context.currentState.run();
    expect(context.currentState.stateType).toBe('TAG_PARSING_STATE');

    // Second run: TagParsingState.run() parses the <file> tag and adds the segment
    context.currentState.run();
    expect(context.currentState.stateType).toBe('FILE_CONTENT_READING_STATE');

    // Verify that the file segment is correctly added
    expect(segments).toEqual([
      {
        type: 'file',
        path: 'src/index.js',
        originalContent: '',
        language: 'javascript'
      }
    ]);
  });

  it('should revert to TextState and treat `<xyz Something else` as text if not `<bash` or `<file`', () => {
    context.buffer = 'xyz Something else';
    context.pos = 0;

    // First run: TagInitializationState.run() processes '<x' and transitions to TextState
    context.currentState.run();
    expect(context.currentState.stateType).toBe('TEXT_STATE');

    // Second run: TextState.run() processes the remaining 'yz Something else'
    context.currentState.run();
    expect(context.currentState).toBeInstanceOf(TextState);

    // Verify that the entire string is appended as a single text segment
    expect(segments).toEqual([
      { type: 'text', content: '<xyz Something else' }
    ]);
  });

  it('should handle partial matches and continue reading if `<ba` is encountered', () => {
    context.buffer = 'ba';
    context.pos = 0;

    // Run: TagInitializationState.run() with partial tag
    context.currentState.run();

    // Since it's a partial match, it should remain in TagInitializationState
    expect(context.currentState.stateType).toBe('TAG_INITIALIZATION_STATE');
    expect(segments).toEqual([]);
  });

  // New test for llm_reasoning_token tag recognition
  it('should transition to TagParsingState when `<llm_reasoning_token` is recognized', () => {
    // Reset context with tagBuffer starting with '<'
    context.tagBuffer = '<';
    context.buffer = 'llm_reasoning_token>';
    context.pos = 0;

    context.currentState.run();
    // After reading the complete token, it should transition to TagParsingState
    expect(context.currentState.stateType).toBe('TAG_PARSING_STATE');
  });
});