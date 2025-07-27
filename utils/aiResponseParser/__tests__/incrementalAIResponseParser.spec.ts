import { IncrementalAIResponseParser } from '../incrementalAIResponseParser';
import type { AIResponseSegment } from '../types';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LLMProvider } from '~/types/llm';
import { ParserContext } from '../stateMachine/ParserContext';
import { getToolParsingStrategy } from '../strategyProvider';
import { AgentRunState } from '~/types/agent/AgentRunState';
import type { Conversation } from '~/types/conversation';

// Mock the toolUtils to have a predictable invocation ID
vi.mock('~/utils/toolUtils', () => ({
  generateBaseInvocationId: (toolName: string, args: Record<string, any>): string => {
    // FIX: Sort keys before stringifying to ensure deterministic IDs
    const sortedArgs = Object.keys(args).sort().reduce((acc, key) => {
      acc[key] = args[key];
      return acc;
    }, {} as Record<string, any>);
    const argString = JSON.stringify(sortedArgs);
    return `call_base_${toolName}_${argString}`;
  }
}));

const createMockConversation = (id: string): Conversation => ({
  id,
  messages: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

describe('IncrementalAIResponseParser with Strategies', () => {
  let segments: AIResponseSegment[];
  let agentRunState: AgentRunState;

  beforeEach(() => {
    segments = [];
    const mockConversation = createMockConversation('test-conv-id');
    agentRunState = new AgentRunState('test-conv-id', mockConversation);
  });

  const createParser = (provider: LLMProvider, useXml: boolean, parseToolCalls: boolean): IncrementalAIResponseParser => {
    const strategy = getToolParsingStrategy(provider, useXml);
    const parserContext = new ParserContext(segments, strategy, useXml, parseToolCalls, agentRunState);
    return new IncrementalAIResponseParser(parserContext);
  };

  it('should parse a complete XML tool_call segment using the XmlToolParsingStrategy', () => {
    const parser = createParser(LLMProvider.ANTHROPIC, true, true);
    
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
    parser.finalize();

    expect(segments).toEqual([
      expect.objectContaining({
        type: 'tool_call',
        toolName: 'file_writer',
        arguments: {
          path: '/test.txt',
          content: 'Hello'
        },
        status: 'parsed',
        invocationId: 'call_base_file_writer_{"content":"Hello","path":"/test.txt"}_0'
      })
    ]);
  });

  it('should parse a complete OpenAI JSON tool_call segment using the OpenAiToolParsingStrategy', () => {
    const parser = createParser(LLMProvider.OPENAI, false, true);

    const chunks = [
      '{"tool_calls": [{',
      '"function": {',
      '"name": "file_reader",',
      '"arguments": "{\\"path\\":\\"/test.txt\\"}"',
      '}}]}',
    ];
    parser.processChunks(chunks);
    parser.finalize();

    expect(segments).toEqual([
      expect.objectContaining({
        type: 'tool_call',
        toolName: 'file_reader',
        arguments: {
          path: '/test.txt'
        },
        status: 'parsed',
        invocationId: 'call_base_file_reader_{"path":"/test.txt"}_0'
      })
    ]);
  });

  it('should handle mixed text and multiple tool calls with different strategies', () => {
    // Test with XML strategy
    const parserXml = createParser(LLMProvider.ANTHROPIC, true, true);
    parserXml.processChunks([' And here is an XML tool: ']);
    parserXml.processChunks(['<tool name="file_reader"><arguments><arg name="path">/data.txt</arg></arguments></tool>']);
    parserXml.processChunks([' All done.']);
    parserXml.finalize();
    
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
    const mockConversation = createMockConversation('test-conv-id-2');
    agentRunState = new AgentRunState('test-conv-id-2', mockConversation); // Reset context for new test
    const parserJson = createParser(LLMProvider.OPENAI, false, true);
    parserJson.processChunks(['Here is a file to write: ']);
    parserJson.processChunks(['{"tool_calls": [{"function": {"name": "file_writer", "arguments": "{\\"path\\":\\"/data.txt\\",\\"content\\":\\"some data\\"}"}}]}']);
    parserJson.finalize();

    expect(segments).toEqual([
        { type: 'text', content: 'Here is a file to write: ' },
        expect.objectContaining({
            type: 'tool_call',
            toolName: 'file_writer'
        })
    ]);
  });

  it('should correctly handle a non-tool JSON object as text', () => {
      const parser = createParser(LLMProvider.OPENAI, false, true);
      parser.processChunks(['This is not a tool: {"key": "value"}']);
      parser.finalize();
      expect(segments).toEqual([
          { type: 'text', content: 'This is not a tool: {"key": "value"}' }
      ]);
  });

  it('should treat tool calls as plain text when parseToolCalls is false but still parse file tags', () => {
    const parser = createParser(LLMProvider.ANTHROPIC, true, false); // parseToolCalls = false
  
    const chunks = [
      'Some text ',
      '<tool name="file_writer"></tool>',
      ' and a file <file path="/test.js">content</file>',
      ' more text.'
    ];
    parser.processChunks(chunks);
    parser.finalize();
  
    expect(segments).toEqual([
      {
        type: 'text',
        content: 'Some text <tool name="file_writer"></tool> and a file '
      },
      expect.objectContaining({
        type: 'file',
        path: '/test.js',
        originalContent: 'content'
      }),
      {
        type: 'text',
        content: ' more text.'
      }
    ]);
  });

  it('should treat an unknown XML tag like <bash> as plain text and not swallow it', () => {
    // This test specifically verifies the fix for the "swallowed tag" bug.
    const parser = createParser(LLMProvider.ANTHROPIC, true, true);

    const chunks = [
      'I am now executing step 4: Developing and presenting the complete solution.\n\n',
      '<bash command="ls" description="Lists all files and directories in the current working directory." />',
      '\n\nI have completed step 4 and am now moving to step 5.'
    ];
    parser.processChunks(chunks);
    parser.finalize();

    // The parser merges consecutive text, so we expect a single text segment
    // containing the full, un-swallowed <bash> tag.
    expect(segments).toEqual([
      {
        type: 'text',
        content: 'I am now executing step 4: Developing and presenting the complete solution.\n\n<bash command="ls" description="Lists all files and directories in the current working directory." />\n\nI have completed step 4 and am now moving to step 5.'
      }
    ]);
  });
});
