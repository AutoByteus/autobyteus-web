import { IncrementalAIResponseParser } from '../incrementalAIResponseParser';
import type { AIResponseSegment } from '../types';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LLMProvider } from '~/types/llm';

// Mock the toolUtils to have a predictable invocation ID
vi.mock('~/utils/toolUtils', () => ({
  generateInvocationId: (toolName: string, args: Record<string, any>): string => {
    const argString = JSON.stringify(args);
    return `call_${toolName}_${argString}`;
  }
}));

describe('IncrementalAIResponseParser with Strategies', () => {
  let segments: AIResponseSegment[];

  it('should parse a complete XML tool_call segment using the XmlStreamingStrategy', () => {
    segments = [];
    const parser = new IncrementalAIResponseParser(segments, LLMProvider.ANTHROPIC, true); // XML is used for Anthropic
    
    const chunks = [
      '<tool name="file_writer" id="123">',
      '<arguments>',
      '<arg name="path">/test.txt</arg>',
      '<arg name="content">Hel',
      'lo</arg>',
      '</arguments>',
      '</tool>'
    ];
    parser.processChunks(chunks);

    expect(segments).toEqual([
      expect.objectContaining({
        type: 'tool_call',
        toolName: 'file_writer',
        arguments: {
          path: '/test.txt',
          content: 'Hello'
        },
        status: 'parsed'
      })
    ]);
  });

  it('should parse a complete OpenAI JSON tool_call segment using the OpenAiStreamingStrategy', () => {
    segments = [];
    const parser = new IncrementalAIResponseParser(segments, LLMProvider.OPENAI, false);

    const chunks = [
      '{"tool_calls": [{',
      '"function": {',
      '"name": "file_reader",',
      '"arguments": "{\\"path\\":\\"/test.txt\\"}"',
      '}}]}',
    ];
    parser.processChunks(chunks);

    expect(segments).toEqual([
      expect.objectContaining({
        type: 'tool_call',
        toolName: 'file_reader',
        arguments: {
          path: '/test.txt'
        },
        status: 'parsed'
      })
    ]);
  });

  it('should handle mixed text and multiple tool calls with different strategies', () => {
    segments = [];
    // Test with XML strategy
    const parserXml = new IncrementalAIResponseParser(segments, LLMProvider.ANTHROPIC, true);
    parserXml.processChunks([' And here is an XML tool: ']);
    parserXml.processChunks(['<tool name="file_reader"><arguments><arg name="path">/data.txt</arg></arguments></tool>']);
    parserXml.processChunks([' All done.']);
    
    expect(segments).toEqual([
        { type: 'text', content: ' And here is an XML tool: ' },
        expect.objectContaining({
            type: 'tool_call',
            toolName: 'file_reader'
        }),
        { type: 'text', content: ' All done.' },
    ]);

    // Test with JSON strategy
    segments = [];
    const parserJson = new IncrementalAIResponseParser(segments, LLMProvider.OPENAI, false);
    parserJson.processChunks(['Here is a file to write: ']);
    parserJson.processChunks(['{"tool_calls": [{"function": {"name": "file_writer", "arguments": "{\\"path\\":\\"/data.txt\\",\\"content\\":\\"some data\\"}"}}]}']);

    expect(segments).toEqual([
        { type: 'text', content: 'Here is a file to write: ' },
        expect.objectContaining({
            type: 'tool_call',
            toolName: 'file_writer'
        })
    ]);
  });

  it('should correctly handle a non-tool JSON object as text', () => {
      segments = [];
      const parser = new IncrementalAIResponseParser(segments, LLMProvider.OPENAI, false);
      parser.processChunks(['This is not a tool: {"key": "value"}']);
      expect(segments).toEqual([
          { type: 'text', content: 'This is not a tool: {"key": "value"}' }
      ]);
  });
});
