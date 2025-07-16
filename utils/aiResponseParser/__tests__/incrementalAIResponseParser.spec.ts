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

  beforeEach(() => {
    segments = [];
  });

  it('should parse a complete XML tool_call segment using the XmlToolParsingStrategy', () => {
    const parser = new IncrementalAIResponseParser(segments, LLMProvider.ANTHROPIC, true, true); // XML is used for Anthropic
    
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
        status: 'parsed'
      })
    ]);
  });

  it('should parse a complete OpenAI JSON tool_call segment using the OpenAiToolParsingStrategy', () => {
    const parser = new IncrementalAIResponseParser(segments, LLMProvider.OPENAI, false, true);

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
        status: 'parsed'
      })
    ]);
  });

  it('should handle mixed text and multiple tool calls with different strategies', () => {
    // Test with XML strategy
    const parserXml = new IncrementalAIResponseParser(segments, LLMProvider.ANTHROPIC, true, true);
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
    const parserJson = new IncrementalAIResponseParser(segments, LLMProvider.OPENAI, false, true);
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
      const parser = new IncrementalAIResponseParser(segments, LLMProvider.OPENAI, false, true);
      parser.processChunks(['This is not a tool: {"key": "value"}']);
      parser.finalize();
      expect(segments).toEqual([
          { type: 'text', content: 'This is not a tool: {"key": "value"}' }
      ]);
  });

  it('should treat tool calls as plain text when parseToolCalls is false but still parse file tags', () => {
    const parser = new IncrementalAIResponseParser(segments, LLMProvider.ANTHROPIC, true, false); // parseToolCalls = false
  
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
});

describe('Edge cases and robustness', () => {
  let segments: AIResponseSegment[];

  beforeEach(() => {
    segments = [];
  });

  it('should treat a <tool> tag without a name attribute as plain text', () => {
    const parser = new IncrementalAIResponseParser(segments, LLMProvider.ANTHROPIC, true, true);
    parser.processChunks(['This is text with <tool> in it.']);
    parser.finalize();
    expect(segments).toEqual([
      { type: 'text', content: 'This is text with <tool> in it.' }
    ]);
  });

  it('should treat a self-closing <tool /> tag without a name attribute as plain text', () => {
    const parser = new IncrementalAIResponseParser(segments, LLMProvider.ANTHROPIC, true, true);
    parser.processChunks(['This is text with <tool/> in it.']);
    parser.finalize();
    expect(segments).toEqual([
      { type: 'text', content: 'This is text with <tool/> in it.' }
    ]);
  });

  it('should treat a <tool> tag with a malformed name attribute as plain text', () => {
    const parser = new IncrementalAIResponseParser(segments, LLMProvider.ANTHROPIC, true, true);
    parser.processChunks(['This is text with <tool name=> in it.']);
    parser.finalize();
    expect(segments).toEqual([
      { type: 'text', content: 'This is text with <tool name=> in it.' }
    ]);
  });
  
  it('should treat an incomplete tool tag at the end of the stream as plain text', () => {
    const parser = new IncrementalAIResponseParser(segments, LLMProvider.ANTHROPIC, true, true);
    parser.processChunks(['An incomplete tag <tool name="file_writer"']);
    parser.finalize();
    expect(segments).toEqual([
      { type: 'text', content: 'An incomplete tag <tool name="file_writer"' }
    ]);
  });

  it('should treat an empty tool_calls object as text and not swallow it', () => {
    const parser = new IncrementalAIResponseParser(segments, LLMProvider.OPENAI, false, true);
    const chunks = ['A JSON blob: {"tool_calls": []} that is not a tool.'];
    parser.processChunks(chunks);
    parser.finalize();

    expect(segments).toEqual([
      { type: 'text', content: 'A JSON blob: {"tool_calls": []} that is not a tool.' },
    ]);
  });

  it('should treat a tool_calls object with invalid content as text and not swallow it', () => {
    const parser = new IncrementalAIResponseParser(segments, LLMProvider.OPENAI, false, true);
    const chunks = ['{"tool_calls": [{}]}'];
    parser.processChunks(chunks);
    parser.finalize();
    expect(segments).toEqual([
        { type: 'text', content: '{"tool_calls": [{}]}' }
    ]);
  });

  // --- JSON EDGE CASES (OpenAI) ---

  it('should treat an incomplete JSON tool call at the end of the stream as plain text', () => {
    const parser = new IncrementalAIResponseParser(segments, LLMProvider.OPENAI, false, true);
    const chunks = ['Thinking... {"tool_calls": [{"function":'];
    parser.processChunks(chunks);
    parser.finalize();
    expect(segments).toEqual([
      { type: 'text', content: 'Thinking... {"tool_calls": [{"function":' }
    ]);
  });
  
  it('should treat a JSON tool call with invalid structure as text', () => {
    const parser = new IncrementalAIResponseParser(segments, LLMProvider.OPENAI, false, true);
    // The tool_calls array contains a string instead of a tool call object.
    const chunks = ['{"tool_calls": ["this is not a valid tool call object"]}'];
    parser.processChunks(chunks);
    parser.finalize();
    expect(segments).toEqual([
      { type: 'text', content: '{"tool_calls": ["this is not a valid tool call object"]}' }
    ]);
  });

  it('should treat a JSON tool call with a missing name as text', () => {
    const parser = new IncrementalAIResponseParser(segments, LLMProvider.OPENAI, false, true);
    const chunks = ['{"tool_calls": [{"function": {"arguments": "{}"}}]}'];
    parser.processChunks(chunks);
    parser.finalize();
    expect(segments).toEqual([
      { type: 'text', content: '{"tool_calls": [{"function": {"arguments": "{}"}}]}' }
    ]);
  });

  it('should treat a JSON tool call with invalid argument types as text', () => {
    const parser = new IncrementalAIResponseParser(segments, LLMProvider.OPENAI, false, true);
    const chunks = ['{"tool_calls": [{"function": {"name": "test", "arguments": 123}}]}'];
    parser.processChunks(chunks);
    parser.finalize();
    expect(segments).toEqual([
      { type: 'text', content: '{"tool_calls": [{"function": {"name": "test", "arguments": 123}}]}' }
    ]);
  });

  it('should correctly parse a tool call with missing (null) arguments', () => {
    const parser = new IncrementalAIResponseParser(segments, LLMProvider.OPENAI, false, true);
    const chunks = ['{"tool_calls": [{"function": {"name": "test", "arguments": null}}]}'];
    parser.processChunks(chunks);
    parser.finalize();
    expect(segments).toEqual([
      expect.objectContaining({
        type: 'tool_call',
        toolName: 'test',
        arguments: {},
        status: 'parsed',
      }),
    ]);
  });

  // --- JSON EDGE CASES (Gemini & Default) ---
  it('should revert malformed Gemini tool call to text', () => {
    const parser = new IncrementalAIResponseParser(segments, LLMProvider.GEMINI, false, true);
    const chunks = ['{"name": "test", "args": "not an object"}'];
    parser.processChunks(chunks);
    parser.finalize();
    expect(segments).toEqual([
      { type: 'text', content: '{"name": "test", "args": "not an object"}' }
    ]);
  });

  it('should revert malformed Default tool call to text', () => {
    const parser = new IncrementalAIResponseParser(segments, LLMProvider.MISTRAL, false, true); // Any provider other than OpenAI/Gemini with JSON
    const chunks = ['{"tool": {"function": 123, "parameters": {}}}'];
    parser.processChunks(chunks);
    parser.finalize();
    expect(segments).toEqual([
      { type: 'text', content: '{"tool": {"function": 123, "parameters": {}}}' }
    ]);
  });

  it('should parse two consecutive Default-style JSON tool calls for a non-OpenAI/Gemini provider', () => {
    // Using ANTHROPIC with useXml: false should trigger the DefaultJsonToolParsingStrategy
    const parser = new IncrementalAIResponseParser(segments, LLMProvider.ANTHROPIC, false, true);
    const llmOutput = `

{
  "tool": {
    "function": "sqlite_write_query",
    "parameters": {
      "query": "UPDATE Person SET age = 24 WHERE name = 'Normy';"
    }
  }
}
{
  "tool": {
    "function": "sqlite_write_query",
    "parameters": {
      "query": "UPDATE Person SET age = 45 WHERE name = 'Ryan';"
    }
  }
}
---"""`;

    parser.processChunks([llmOutput]);
    parser.finalize();

    const toolCalls = segments.filter(s => s.type === 'tool_call');
    expect(toolCalls).toHaveLength(2);

    expect(segments.length).toBe(5);

    expect(segments[0]).toEqual({ type: 'text', content: '\n\n' });
    expect(segments[1].type).toBe('tool_call');
    expect(segments[2]).toEqual({ type: 'text', content: '\n' });
    expect(segments[3].type).toBe('tool_call');
    expect(segments[4]).toEqual({ type: 'text', content: '\n---"""' });
  });

  it('should parse two consecutive XML tool calls with surrounding text', () => {
    const parser = new IncrementalAIResponseParser(segments, LLMProvider.ANTHROPIC, true, true);
    const llmOutput = `Thinking...
<tool name="list_files"><arguments><arg name="path">./src</arg></arguments></tool>
Okay, I see the files. Now I will read one.
<tool name="read_file"><arguments><arg name="path">./src/main.js</arg></arguments></tool>
Done.`;

    parser.processChunks([llmOutput]);
    parser.finalize();
    
    expect(segments.filter(s => s.type === 'tool_call')).toHaveLength(2);
    expect(segments.length).toBe(5);

    expect(segments[0]).toEqual({ type: 'text', content: 'Thinking...\n' });
    expect(segments[1]).toEqual(expect.objectContaining({
      type: 'tool_call',
      toolName: 'list_files',
      arguments: { path: './src' }
    }));
    expect(segments[2]).toEqual({ type: 'text', content: '\nOkay, I see the files. Now I will read one.\n' });
    expect(segments[3]).toEqual(expect.objectContaining({
      type: 'tool_call',
      toolName: 'read_file',
      arguments: { path: './src/main.js' }
    }));
    expect(segments[4]).toEqual({ type: 'text', content: '\nDone.' });
  });

  it('should parse two consecutive Gemini-style JSON tool calls with surrounding text', () => {
    const parser = new IncrementalAIResponseParser(segments, LLMProvider.GEMINI, false, true);
    const llmOutput = `Here are the tools to run:
{"name": "get_weather", "args": {"location": "Boston"}}
{"name": "get_time", "args": {}}
That is all.`;

    parser.processChunks([llmOutput]);
    parser.finalize();

    expect(segments.filter(s => s.type === 'tool_call')).toHaveLength(2);
    expect(segments.length).toBe(5);
    
    expect(segments[0]).toEqual({ type: 'text', content: 'Here are the tools to run:\n' });
    expect(segments[1]).toEqual(expect.objectContaining({
      type: 'tool_call',
      toolName: 'get_weather',
      arguments: { location: 'Boston' }
    }));
    expect(segments[2]).toEqual({ type: 'text', content: '\n' });
    expect(segments[3]).toEqual(expect.objectContaining({
      type: 'tool_call',
      toolName: 'get_time',
      arguments: {}
    }));
    expect(segments[4]).toEqual({ type: 'text', content: '\nThat is all.' });
  });

  it('should parse two consecutive OpenAI-style JSON tool calls with surrounding text', () => {
    const parser = new IncrementalAIResponseParser(segments, LLMProvider.OPENAI, false, true);
    const llmOutput = `I will run two tools.
{"tool_calls": [{"function": {"name": "create_user", "arguments": "{\\"name\\":\\"Alice\\"}"}}]}
Then, I will confirm the user.
{"tool_calls": [{"function": {"name": "get_user", "arguments": "{\\"name\\":\\"Alice\\"}"}}]}
All finished.`;

    parser.processChunks([llmOutput]);
    parser.finalize();
    
    expect(segments.filter(s => s.type === 'tool_call')).toHaveLength(2);
    expect(segments.length).toBe(5);

    expect(segments[0]).toEqual({ type: 'text', content: 'I will run two tools.\n' });
    expect(segments[1]).toEqual(expect.objectContaining({
      type: 'tool_call',
      toolName: 'create_user',
      arguments: { name: 'Alice' }
    }));
    expect(segments[2]).toEqual({ type: 'text', content: '\nThen, I will confirm the user.\n' });
    expect(segments[3]).toEqual(expect.objectContaining({
      type: 'tool_call',
      toolName: 'get_user',
      arguments: { name: 'Alice' }
    }));
    expect(segments[4]).toEqual({ type: 'text', content: '\nAll finished.' });
  });
});