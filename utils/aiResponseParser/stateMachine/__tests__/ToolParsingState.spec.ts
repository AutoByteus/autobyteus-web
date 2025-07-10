import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ToolParsingState } from '../ToolParsingState';
import { TextState } from '../TextState';
import { ParserContext } from '../ParserContext';
import type { AIResponseSegment } from '../../types';
import type { ToolParsingStrategy, SignatureMatch } from '../../streaming_strategies/base';

// Mock the tool utils to prevent the sha256 error and make tests predictable.
vi.mock('~/utils/toolUtils', () => ({
  generateInvocationId: (toolName: string, args: Record<string, any>): string => {
    const argString = JSON.stringify(args);
    return `call_${toolName}_${argString}`;
  }
}));

// A simple mock strategy for precise control over the state's behavior
class MockToolStrategy implements ToolParsingStrategy {
  signature = '{';
  private complete = false;
  public startSegmentCalled = false;
  public processCharCalledWith: string[] = [];
  public finalizeCalled = false;

  checkSignature(buffer: string): SignatureMatch {
    return buffer.startsWith(this.signature) ? 'match' : 'no_match';
  }
  startSegment(context: ParserContext, signatureBuffer: string): void {
    this.startSegmentCalled = true;
    context.startJsonToolCallSegment(); // Simulate creating a segment
  }
  processChar(char: string, context: ParserContext): void {
    this.processCharCalledWith.push(char);
    if (char === ';') {
      this.complete = true;
    }
  }
  finalize(context: ParserContext): void {
    this.finalizeCalled = true;
    context.finalizeJsonSegment([{ name: 'mock_tool', arguments: {} }]);
  }
  isComplete(): boolean {
    return this.complete;
  }
}

describe('ToolParsingState', () => {
  let segments: AIResponseSegment[];
  let context: ParserContext;
  let mockStrategy: MockToolStrategy;
  let state: ToolParsingState;

  beforeEach(() => {
    segments = [];
    mockStrategy = new MockToolStrategy();
    context = new ParserContext(segments, mockStrategy, false);
    vi.clearAllMocks();
  });

  it('should call strategy.startSegment upon construction and advance context', () => {
    // A previous state finds the signature and passes it to the constructor.
    // The previous state does not advance the cursor over the signature.
    context.buffer = '{';
    context.pos = 0;
    state = new ToolParsingState(context, '{');
    expect(mockStrategy.startSegmentCalled).toBe(true);
    expect(segments[0]?.type).toBe('tool_call');
    // Constructor is responsible for advancing past the signature it consumes.
    expect(context.pos).toBe(1);
  });

  it('should loop and call processChar for each character until the strategy is complete', () => {
    context.buffer = '{abc;def';
    context.pos = 0; 
    
    state = new ToolParsingState(context, '{');
    state.run();

    expect(mockStrategy.processCharCalledWith).toEqual(['a', 'b', 'c', ';']);
    expect(mockStrategy.finalizeCalled).toBe(true);
    expect(context.currentState).toBeInstanceOf(TextState);
  });

  it('should leave remaining characters in the buffer for the next state', () => {
    context.buffer = '{abc;def';
    context.pos = 0;
    state = new ToolParsingState(context, '{');

    state.run();

    // The tool call was '{' (1 char) + 'abc;' (4 chars). Total 5 chars consumed.
    expect(context.pos).toBe(5);
    expect(context.buffer.substring(context.pos)).toBe('def');
  });
  
  it('should handle when the strategy is completed by the signature buffer alone', () => {
    mockStrategy.isComplete = () => true;

    context.buffer = ';more-text';
    context.pos = 0;
    
    state = new ToolParsingState(context, ';');
    state.run();
    
    expect(mockStrategy.processCharCalledWith).toEqual([]);
    expect(mockStrategy.finalizeCalled).toBe(true);
    expect(context.currentState).toBeInstanceOf(TextState);
    expect(context.pos).toBe(1); 
    expect(context.buffer.substring(context.pos)).toBe('more-text');
  });
});
