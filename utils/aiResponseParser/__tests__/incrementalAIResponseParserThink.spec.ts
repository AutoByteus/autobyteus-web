import { IncrementalAIResponseParser } from '../incrementalAIResponseParser';
import type { AIResponseSegment } from '../types';
import { describe, it, expect, beforeEach } from 'vitest';

describe('IncrementalAIResponseParser with think segments', () => {
  let parser: IncrementalAIResponseParser;
  let segments: AIResponseSegment[];

  beforeEach(() => {
    segments = [];
    parser = new IncrementalAIResponseParser(segments);
  });

  it('should parse a complete think segment received in one chunk', () => {
    parser.processChunks(['<llm_reasoning_token>Thinking output here</llm_reasoning_token>']);
    expect(segments).toEqual([
      { type: 'think', content: 'Thinking output here' }
    ]);
  });

  it('should parse a think segment received in multiple chunks', () => {
    parser.processChunks(['<llm_reas']);
    parser.processChunks(['oning_token>Partial ']);
    parser.processChunks(['think output']);
    parser.processChunks(['</llm_reas']);
    parser.processChunks(['oning_token>']);
    expect(segments).toEqual([
      { type: 'think', content: 'Partial think output' }
    ]);
  });

  it('should handle mixed segments including think segments', () => {
    parser.processChunks(['Intro text ']);
    expect(segments).toEqual([
      { type: 'text', content: 'Intro text ' }
    ]);

    parser.processChunks(['<llm_reasoning_token>']);
    // After processing the think tag, a think segment is created with empty content.
    expect(segments).toEqual([
      { type: 'text', content: 'Intro text ' },
      { type: 'think', content: '' }
    ]);

    parser.processChunks(['Thinking step one.']);
    parser.processChunks(['</llm_reasoning_token>']);
    expect(segments).toEqual([
      { type: 'text', content: 'Intro text ' },
      { type: 'think', content: 'Thinking step one.' }
    ]);

    parser.processChunks([' Final text.']);
    expect(segments).toEqual([
      { type: 'text', content: 'Intro text ' },
      { type: 'think', content: 'Thinking step one.' },
      { type: 'text', content: ' Final text.' }
    ]);
  });

  it('should append multiple think segments separately', () => {
    parser.processChunks(['<llm_reasoning_token>First thinking.</llm_reasoning_token>']);
    parser.processChunks([' Some text ']);
    parser.processChunks(['<llm_reasoning_token>Second thinking.</llm_reasoning_token>']);
    expect(segments).toEqual([
      { type: 'think', content: 'First thinking.' },
      { type: 'text', content: ' Some text ' },
      { type: 'think', content: 'Second thinking.' }
    ]);
  });

  it('should handle partial think tag matches and complete the segment correctly', () => {
    parser.processChunks(['<llm_reasoning_token>Unfinished thinking']);
    // Now, a think segment is created with the partial content.
    expect(segments).toEqual([
      { type: 'think', content: 'Unfinished thinking' }
    ]);
    parser.processChunks([' still going...']);
    parser.processChunks(['</llm_reasoning_token>']);
    expect(segments).toEqual([
      { type: 'think', content: 'Unfinished thinking still going...' }
    ]);
  });
});
