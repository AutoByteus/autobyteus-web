import { describe, it, expect, beforeEach } from 'vitest';
import { FileContentReadingState } from '../FileContentReadingState';
import { ParserContext } from '../ParserContext';
import { FileClosingTagScanState } from '../FileClosingTagScanState';
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

describe('FileContentReadingState', () => {
  let segments: AIResponseSegment[];
  let context: ParserContext;
  let agentRunState: AgentRunState;

  beforeEach(() => {
    segments = [];
    const mockConversation = createMockConversation('test-conv-id');
    agentRunState = new AgentRunState('test-conv-id', mockConversation);
    context = new ParserContext(segments, new DefaultJsonToolParsingStrategy(), false, true, agentRunState);
    context.startFileSegment('src/app.js');
    context.currentState = new FileContentReadingState(context);
  });

  it('should append characters to file segment content until `<` encountered', () => {
    context.buffer = '\nconsole.log("Hello");<'; // Add newline to test the fix
    context.pos = 0;
    context.currentState.run();

    expect(segments).toEqual([
      {
        type: 'file',
        path: 'src/app.js',
        originalContent: 'console.log("Hello");',
        language: 'javascript'
      }
    ]);
    expect(context.currentState).toBeInstanceOf(FileClosingTagScanState);
  });

  it('should handle input with no `<` and append all to file segment', () => {
    context.buffer = 'console.log("No closing tag yet")';
    context.pos = 0;
    context.currentState.run();

    expect(segments).toEqual([
      {
        type: 'file',
        path: 'src/app.js',
        originalContent: 'console.log("No closing tag yet")',
        language: 'javascript'
      }
    ]);
    expect(context.currentState.stateType).toBe('FILE_CONTENT_READING_STATE');
  });

  it('should handle empty buffer gracefully', () => {
    context.buffer = '';
    context.pos = 0;
    context.currentState.run();
    expect(segments).toEqual([
      {
        type: 'file',
        path: 'src/app.js',
        originalContent: '',
        language: 'javascript'
      }
    ]);
    expect(context.currentState.stateType).toBe('FILE_CONTENT_READING_STATE');
  });
});
