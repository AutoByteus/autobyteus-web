import { IncrementalAIResponseParser } from '../incrementalAIResponseParser';
import type { AIResponseSegment, ToolCallSegment, IframeSegment } from '../types';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { LLMProvider } from '~/types/llm';
import { ParserContext } from '../stateMachine/ParserContext';
import { AgentRunState } from '~/types/agent/AgentRunState';
import type { Conversation, AIMessage } from '~/types/conversation';
import { AgentContext } from '~/types/agent/AgentContext';
import type { AgentRunConfig } from '~/types/agent/AgentRunConfig';
import sha256 from 'crypto-js/sha256';

// Helper for creating deterministic JSON strings for mock invocation IDs
const deterministicJsonStringify = (value: any): string => {
  if (value === null || typeof value !== 'object') {
    // Standard JSON.stringify is fine for primitives
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    // Recursively process array elements
    return `[${value.map(deterministicJsonStringify).join(',')}]`;
  }
  // For objects, sort keys and recursively process values
  const keys = Object.keys(value).sort();
  const pairs = keys.map(key => {
    const k = JSON.stringify(key);
    const v = deterministicJsonStringify(value[key]);
    return `${k}:${v}`;
  });
  return `{${pairs.join(',')}}`;
};

// MOCK: This mock now generates an ID with the 'mock_call_' prefix for test clarity.
vi.mock('~/utils/toolUtils', () => ({
  generateBaseInvocationId: (toolName: string, args: Record<string, any>): string => {
    const canonicalArgs = deterministicJsonStringify(args);
    const hashString = `${toolName}:${canonicalArgs}`;
    console.log(`[Frontend Test Mock] Generating tool invocation ID from hash_string: '${hashString}'`);
    const hash = sha256(hashString).toString();
    return `mock_call_${hash}`;
  }
}));

vi.mock('~/stores/llmProviderConfig', () => ({
  useLLMProviderConfigStore: vi.fn(() => ({
    getProviderForModel: (llmModelIdentifier: string) => {
      if (llmModelIdentifier === 'anthropic') return LLMProvider.ANTHROPIC;
      if (llmModelIdentifier === 'openai') return LLMProvider.OPENAI;
      if (llmModelIdentifier === 'gemini') return LLMProvider.GEMINI;
      return LLMProvider.DEEPSEEK;
    },
  })),
}));

const createMockAgentContext = (
  segments: AIResponseSegment[],
  llmModelIdentifier: string,
  parseToolCalls: boolean,
  convId: string
): AgentContext => {
  const conversation: Conversation = {
    id: convId,
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const lastAIMessage: AIMessage = {
    type: 'ai', text: '', timestamp: new Date(), chunks: [],
    segments: segments, isComplete: false, parserInstance: null as any,
  };
  conversation.messages.push(lastAIMessage);

  const agentState = new AgentRunState(convId, conversation);
  const agentConfig: AgentRunConfig = {
    launchProfileId: 'test-profile', workspaceId: null,
    llmModelIdentifier: llmModelIdentifier, autoExecuteTools: false, parseToolCalls: parseToolCalls,
    useXmlToolFormat: llmModelIdentifier === 'anthropic',
  };

  return new AgentContext(agentConfig, agentState);
};

describe('IncrementalAIResponseParser with Strategies', () => {
  let segments: AIResponseSegment[];

  beforeEach(() => {
    setActivePinia(createPinia());
    segments = [];
  });

  const createParser = (provider: LLMProvider, parseToolCalls: boolean): IncrementalAIResponseParser => {
    let llmModelIdentifier = 'default';
    if (provider === LLMProvider.ANTHROPIC) llmModelIdentifier = 'anthropic';
    else if (provider === LLMProvider.OPENAI) llmModelIdentifier = 'openai';
    else if (provider === LLMProvider.GEMINI) llmModelIdentifier = 'gemini';

    const agentContext = createMockAgentContext(segments, llmModelIdentifier, parseToolCalls, `test-conv-${Date.now()}`);
    const parserContext = new ParserContext(agentContext);
    return new IncrementalAIResponseParser(parserContext);
  };

  it('should parse a complete XML tool_call segment using the XmlToolParsingStrategy', () => {
    const parser = createParser(LLMProvider.ANTHROPIC, true);
    
    const chunks = [
      '<tool name="write_file" id="123">',
      '<arguments>',
      '<arg name="path">/test.txt</arg>',
      '<arg name="content">Hel',
      'lo</arg>',
      '</arguments>',
      '</tool>'
    ];
    parser.processChunks(chunks);
    parser.finalize();

    const expectedHash = sha256(`write_file:${deterministicJsonStringify({ path: '/test.txt', content: 'Hello' })}`).toString();

    expect(segments).toEqual([
      expect.objectContaining({
        type: 'tool_call',
        toolName: 'write_file',
        arguments: {
          path: '/test.txt',
          content: 'Hello'
        },
        status: 'parsed',
        invocationId: `mock_call_${expectedHash}_0`
      })
    ]);
  });

  it('should parse a complex, streamed XML tool call with nested lists and objects', () => {
    const parser = createParser(LLMProvider.ANTHROPIC, true);
    
    const chunks = [
      '<tool name="ComplexTool"><arguments><arg name="name">Pro',
      'ject X</arg><arg name="config"><arg name="retries">3</arg><arg name="flags">',
      '<item>A</item><item>B</item></arg></arg><arg name="users">',
      '<item><arg name="name">Alice</arg><arg name="id">101</arg></item>',
      '<item><arg name="name">Bob</arg><arg name="id">102</arg></item>',
      '</arg></arguments></tool>'
    ];
    
    parser.processChunks(chunks);
    parser.finalize();
    
    const expectedArgs = {
      name: 'Project X',
      config: {
        retries: '3',
        flags: ['A', 'B']
      },
      users: [
        { name: 'Alice', id: '101' },
        { name: 'Bob', id: '102' }
      ]
    };
    
    const expectedHash = sha256(`ComplexTool:${deterministicJsonStringify(expectedArgs)}`).toString();

    expect(segments).toEqual([
      expect.objectContaining({
        type: 'tool_call',
        toolName: 'ComplexTool',
        arguments: expectedArgs,
        status: 'parsed',
        invocationId: `mock_call_${expectedHash}_0`
      })
    ]);
  });
  
  // NEW TEST CASE FOR THE PRODUCTION XML ISSUE
  it('should correctly parse the production XML case and log the generated ID', () => {
    const parser = createParser(LLMProvider.ANTHROPIC, true);
    const xml = `<tool name="PublishTaskPlan"><arguments><arg name="plan"><arg name="overall_goal">Ship a playable demo</arg><arg name="tasks"><item><arg name="task_name">build_ui</arg><arg name="assignee_name">Engineer</arg><arg name="description">Create minimal UI</arg></item><item><arg name="task_name">write_tests</arg><arg name="assignee_name">QA</arg><arg name="description">Cover happy path</arg><arg name="dependencies"><item>build_ui</item></arg></item></arg></arg></arguments></tool>`;

    parser.processChunks([xml]);
    parser.finalize();

    expect(segments.length).toBe(1);
    const segment = segments[0] as ToolCallSegment;
    expect(segment.type).toBe('tool_call');
    expect(segment.toolName).toBe('PublishTaskPlan');
    expect(segment.arguments.plan.tasks.length).toBe(2);

    // FIX: Log the entire segment object to ensure we see the final ID after all processing.
    console.log('[Frontend Test] Final Segment for Production XML Case:', segment);
    
    expect(segment.invocationId).toContain('mock_call_');
    expect(segment.invocationId.length).toBe('mock_call_'.length + 64 + '_0'.length); // Ensure it's a hash
  });

  it('should correctly parse a large code block with special XML characters as a single string argument', () => {
    const parser = createParser(LLMProvider.ANTHROPIC, true);

    // This is the raw content string, exactly as it should appear in the final parsed arguments.
    // It contains XML entities because that's what the LLM must generate to produce valid XML.
    // The write_file parser is designed to NOT decode this specific argument.
    const codeContent = `def check_value(x):
    # keep XML entities literal: &lt; &gt; &amp; and "quotes"
    if x &lt; 3 and x &gt; 1:
        return "ok &amp; steady"
    return "&lt;tag&gt;not xml&lt;/tag&gt;"`;

    const xml = `<tool name="write_file"><arguments><arg name="path">test.py</arg><arg name="content">${codeContent}</arg></arguments></tool>`;
    
    parser.processChunks([xml]);
    parser.finalize();

    expect(segments.length).toBe(1);
    const segment = segments[0] as ToolCallSegment;
    expect(segment.type).toBe('tool_call');
    expect(segment.toolName).toBe('write_file');

    // Crucial assertions: The arguments should be parsed correctly,
    // and the 'content' field must be a single string identical to the original code block.
    expect(Object.keys(segment.arguments)).toEqual(['path', 'content']);
    expect(segment.arguments.path).toBe('test.py');
    expect(typeof segment.arguments.content).toBe('string');
    // FIX: Assert that the content is the raw, undecoded string.
    expect(segment.arguments.content).toBe(codeContent);
    
    // Also verify the invocation ID is generated correctly using the raw content.
    const expectedArgs = { path: 'test.py', content: codeContent };
    const expectedHash = sha256(`write_file:${deterministicJsonStringify(expectedArgs)}`).toString();
    expect(segment.invocationId).toBe(`mock_call_${expectedHash}_0`);
  });

  // NEW TEST CASE FROM BACKEND SUITE
  it('should correctly parse the second large code block from backend tests', () => {
    const parser = createParser(LLMProvider.ANTHROPIC, true);

    const codeContentWithEscapedChars = `"""Wraps screen edges""" snake = Snake(); snake.positions=[(0,0)]; assert 0 &lt;= snake.positions[0][0] &lt; 40 # keep raw entities`;

    const xml = `<tool name="write_file"><arguments><arg name="path">test_snake_game.py</arg><arg name="content">${codeContentWithEscapedChars}</arg></arguments></tool>`;
    
    parser.processChunks([xml]);
    parser.finalize();

    expect(segments.length).toBe(1);
    const segment = segments[0] as ToolCallSegment;
    expect(segment.type).toBe('tool_call');
    expect(segment.toolName).toBe('write_file');
    expect(segment.arguments.path).toBe('test_snake_game.py');
    expect(typeof segment.arguments.content).toBe('string');
    // FIX: Assert that the content is the raw, undecoded string.
    expect(segment.arguments.content).toBe(codeContentWithEscapedChars);

    // Log the generated ID for comparison with the backend
    console.log(`[Frontend Test] Generated ID for second large code block: ${segment.invocationId}`);

    // FIX: Use the raw, undecoded content for the hash generation.
    const expectedArgs = { path: 'test_snake_game.py', content: codeContentWithEscapedChars };
    const expectedHash = sha256(`write_file:${deterministicJsonStringify(expectedArgs)}`).toString();
    expect(segment.invocationId).toBe(`mock_call_${expectedHash}_0`);
  });

  // NEW TEST CASE based on user-provided image to enhance test coverage
  it('should correctly parse a write_file tool call with Python code content', () => {
    const parser = createParser(LLMProvider.ANTHROPIC, true);

    const snakeGameCode = `import pygame
WIDTH, HEIGHT = 800, 600

class Snake:
    def __init__(self):
        self.length = 1
        self.score = 0`;
    
    // The content does not contain special XML characters, so no escaping is needed here.
    const xml = `<tool name="write_file"><arguments><arg name="path">snake_game.py</arg><arg name="content">${snakeGameCode}</arg></arguments></tool>`;
    
    parser.processChunks([xml]);
    parser.finalize();

    expect(segments.length).toBe(1);
    const segment = segments[0] as ToolCallSegment;
    expect(segment.type).toBe('tool_call');
    expect(segment.toolName).toBe('write_file');
    expect(segment.arguments.path).toBe('snake_game.py');
    expect(segment.arguments.content).toBe(snakeGameCode);

    // Also verify the invocation ID is generated correctly and deterministically
    const expectedArgs = { path: 'snake_game.py', content: snakeGameCode };
    const expectedHash = sha256(`write_file:${deterministicJsonStringify(expectedArgs)}`).toString();
    expect(segment.invocationId).toBe(`mock_call_${expectedHash}_0`);

    // Log the final segment to the console for user visibility
    console.log('[Frontend Test] Final Segment for Snake Game Case:', segment);
  });

  it('should correctly parse the live XML case for CreatePromptRevision and match backend hash logic', () => {
    const parser = createParser(LLMProvider.ANTHROPIC, true);

    // FIX: Syntax error from previous attempt is removed.
    const newPromptContent = `Role: Agent Creator. Phase1 gather requirements then call CreatePrompt with {{tools}} placeholder. Phase2 pick tools. Phase3 create agent with prompt_id and selected tools. When calling tools emit raw JSON only (no code fences).`;

    // FIX: Use the raw XML entity in the input string. This is the correct test data.
    const newDescription = "Structured flow A -&gt; B -&gt; C with {{tools}} placeholder.";
    
    const xml = `<tool name="CreatePromptRevision"> <arguments> <arg name="base_prompt_id">32</arg> <arg name="new_prompt_content">${newPromptContent}</arg> <arg name="new_description">${newDescription}</arg> </arguments></tool>`;
    
    parser.processChunks([xml]);
    parser.finalize();

    expect(segments.length).toBe(1);
    const segment = segments[0] as ToolCallSegment;
    expect(segment.type).toBe('tool_call');
    expect(segment.toolName).toBe('CreatePromptRevision');
    
    // FIX: The expected arguments MUST match the raw input, with entities preserved.
    const expectedArgs = {
        base_prompt_id: "32",
        new_prompt_content: newPromptContent,
        new_description: newDescription
    };

    expect(segment.arguments).toEqual(expectedArgs);

    // Verify the invocation ID is generated correctly using the raw, un-decoded content.
    const expectedHash = sha256(`CreatePromptRevision:${deterministicJsonStringify(expectedArgs)}`).toString();
    expect(segment.invocationId).toBe(`mock_call_${expectedHash}_0`);
    console.log(`[Frontend Test] Generated ID for Live XML case: ${segment.invocationId}`);
  });

  it('should parse a complete OpenAI JSON tool_call segment using the OpenAiToolParsingStrategy', () => {
    const parser = createParser(LLMProvider.OPENAI, true);

    const chunks = [
      '{"tool_calls": [{',
      '"function": {',
      '"name": "file_reader",',
      '"arguments": "{\\"path\\":\\"/test.txt\\"}"',
      '}}]}',
    ];
    parser.processChunks(chunks);
    parser.finalize();
    const expectedHash = sha256(`file_reader:${deterministicJsonStringify({ path: '/test.txt' })}`).toString();

    expect(segments).toEqual([
      expect.objectContaining({
        type: 'tool_call',
        toolName: 'file_reader',
        arguments: {
          path: '/test.txt'
        },
        status: 'parsed',
        invocationId: `mock_call_${expectedHash}_0`
      })
    ]);
  });

  it('should parse a complete Gemini JSON tool_call array using the GeminiToolParsingStrategy', () => {
    const parser = createParser(LLMProvider.GEMINI, true);
    const chunks = [
      'Some text first ',
      '[',
      '{',
      '"name": "ListAvailableTools",',
      '"args": {}',
      '}]',
      ' some text after.'
    ];
    parser.processChunks(chunks);
    parser.finalize();

    const expectedHash = sha256(`ListAvailableTools:${deterministicJsonStringify({})}`).toString();
    
    expect(segments).toEqual([
        { type: 'text', content: 'Some text first ' },
        expect.objectContaining({
          type: 'tool_call',
          toolName: 'ListAvailableTools',
          arguments: {},
          status: 'parsed',
          invocationId: `mock_call_${expectedHash}_0`
        }),
        { type: 'text', content: ' some text after.' }
    ]);
  });

  it('should parse multiple Gemini tool calls from a single JSON array', () => {
    const parser = createParser(LLMProvider.GEMINI, true);
    const chunks = [
      '[',
      '{"name": "tool_one", "args": {"p": 1}},',
      '{"name": "tool_two", "args": {"q": 2}}',
      ']'
    ];
    parser.processChunks(chunks);
    parser.finalize();

    const hash1 = sha256(`tool_one:${deterministicJsonStringify({ p: 1 })}`).toString();
    const hash2 = sha256(`tool_two:${deterministicJsonStringify({ q: 2 })}`).toString();

    expect(segments).toEqual([
        expect.objectContaining({
          type: 'tool_call',
          toolName: 'tool_one',
          arguments: { p: 1 },
          invocationId: `mock_call_${hash1}_0`
        }),
        expect.objectContaining({
          type: 'tool_call',
          toolName: 'tool_two',
          arguments: { q: 2 },
          invocationId: `mock_call_${hash2}_0`
        })
    ]);
  });

  it('should handle nested JSON in tool call arguments for OpenAI (stringified)', () => {
    const parser = createParser(LLMProvider.OPENAI, true);

    const chunks = [
      '{"tool_calls": [{',
      '"function": {',
      '"name": "complex_tool",',
      '"arguments": "{\\"config\\":{\\"type\\":\\"special\\",\\"retries\\":3},\\"data\\":[1,2,3]}"',
      '}}]}',
    ];
    parser.processChunks(chunks);
    parser.finalize();

    const expectedArgs = {
      config: { type: 'special', retries: 3 },
      data: [1, 2, 3]
    };
    const expectedHash = sha256(`complex_tool:${deterministicJsonStringify(expectedArgs)}`).toString();

    expect(segments).toEqual([
      expect.objectContaining({
        type: 'tool_call',
        toolName: 'complex_tool',
        arguments: expectedArgs,
        status: 'parsed',
        invocationId: `mock_call_${expectedHash}_0`
      })
    ]);
  });

  it('should handle nested JSON in tool call arguments for OpenAI (direct object)', () => {
    const parser = createParser(LLMProvider.OPENAI, true);

    const chunks = [
      '{"tool_calls": [{',
      '"function": {',
      '"name": "direct_complex_tool",',
      '"arguments": {',
      '  "config": {',
      '    "type": "direct",',
      '    "retries": 5',
      '  },',
      '  "data": [',
      '    "a", "b"',
      '  ]',
      '}',
      '}}]}',
    ];
    parser.processChunks(chunks);
    parser.finalize();
    
    const expectedArgs = {
        config: { type: 'direct', retries: 5 },
        data: ["a", "b"]
    };
    const expectedHash = sha256(`direct_complex_tool:${deterministicJsonStringify(expectedArgs)}`).toString();

    expect(segments).toEqual([
      expect.objectContaining({
        type: 'tool_call',
        toolName: 'direct_complex_tool',
        arguments: expectedArgs,
        status: 'parsed',
        invocationId: `mock_call_${expectedHash}_0`
      })
    ]);
  });
  
  // NEW TEST CASE FOR THE USER'S LIVE EXAMPLE
  it('should generate a deterministic ID matching the backend for complex Gemini case with unicode', () => {
    const parser = createParser(LLMProvider.GEMINI, true);
    
    const toolName = "CreatePromptRevision";
    const args = {
        "base_prompt_id": "6",
        "new_prompt_content": "You are the Jira helper. Manage issues and pages.\n- Create/update/search\n- Keep {{tools}} placeholder\n- Return raw JSON tool calls.",
        "new_description": "Jira + Confluence assistant with {{tools}}."
    };
    
    // The Gemini parser expects an array of tool calls or a single tool call object
    const toolCallObject = {
        name: toolName,
        args: args
    };
    const chunk = JSON.stringify(toolCallObject);

    parser.processChunks([chunk]);
    parser.finalize();
    
    const segment = segments[0] as ToolCallSegment;
    
    expect(segment.type).toBe('tool_call');
    expect(segment.toolName).toBe(toolName);
    expect(segment.invocationId).toContain('mock_call_');
    expect(segment.invocationId.length).toBe('mock_call_'.length + 64 + '_0'.length);
  });

  it('should handle mixed text and multiple tool calls with different strategies', () => {
    // Test with XML strategy
    const parserXml = createParser(LLMProvider.ANTHROPIC, true);
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
    const parserJson = createParser(LLMProvider.OPENAI, true);
    parserJson.processChunks(['Here is a file to write: ']);
    parserJson.processChunks(['{"tool_calls": [{"function": {"name": "write_file", "arguments": "{\\"path\\":\\"/data.txt\\",\\"content\\":\\"some data\\"}"}}]}']);
    parserJson.finalize();

    expect(segments).toEqual([
        { type: 'text', content: 'Here is a file to write: ' },
        expect.objectContaining({
            type: 'tool_call',
            toolName: 'write_file'
        })
    ]);
  });

  it('should correctly handle a non-tool JSON object as text', () => {
      const parser = createParser(LLMProvider.OPENAI, true);
      parser.processChunks(['This is not a tool: {"key": "value"}']);
      parser.finalize();
      expect(segments).toEqual([
          { type: 'text', content: 'This is not a tool: {"key": "value"}' }
      ]);
  });

  it('should treat tool calls as plain text when parseToolCalls is false but still parse file tags', () => {
    const parser = createParser(LLMProvider.ANTHROPIC, false); // parseToolCalls = false
  
    const chunks = [
      'Some text ',
      '<tool name="write_file"></tool>',
      ' and a file <file path="/test.js">content</file>',
      ' more text.'
    ];
    parser.processChunks(chunks);
    parser.finalize();
  
    expect(segments).toEqual([
      {
        type: 'text',
        content: 'Some text <tool name="write_file"></tool> and a file '
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
    const parser = createParser(LLMProvider.ANTHROPIC, true);

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

  it('should correctly parse a single chunk containing mixed content', () => {
    const parser = createParser(LLMProvider.ANTHROPIC, true);
    
    const singleChunk = 'Here is some initial text. ' +
                      '<tool name="test_tool"><arguments><arg name="p1">v1</arg></arguments></tool>' +
                      ' Followed by more text and a file.' +
                      '<file path="/example.txt">File content here.</file>' +
                      ' And some final text.';

    parser.processChunks([singleChunk]);
    parser.finalize();

    expect(segments).toEqual([
      { type: 'text', content: 'Here is some initial text. ' },
      expect.objectContaining({
        type: 'tool_call',
        toolName: 'test_tool',
        arguments: { p1: 'v1' },
      }),
      { type: 'text', content: ' Followed by more text and a file.' },
      expect.objectContaining({
        type: 'file',
        path: '/example.txt',
        originalContent: 'File content here.',
      }),
      { type: 'text', content: ' And some final text.' },
    ]);
  });

  it('should correctly parse a single chunk with nested file tags', () => {
    const parser = createParser(LLMProvider.ANTHROPIC, true);
    const innerFileContent = 'Content of inner file.';
    const outerFileContent = `Content of outer file, which includes a nested file: <file path="inner.txt">${innerFileContent}</file> More outer content.`;
    const singleChunk = `Initial text. <file path="outer.txt">${outerFileContent}</file> Final text.`;

    parser.processChunks([singleChunk]);
    parser.finalize();

    expect(segments).toEqual([
      { type: 'text', content: 'Initial text. ' },
      expect.objectContaining({
        type: 'file',
        path: 'outer.txt',
        originalContent: outerFileContent,
      }),
      { type: 'text', content: ' Final text.' },
    ]);
  });

  it('should correctly parse a complex real-world Gemini response with multiple tool calls and nested escaped JSON', () => {
    const parser = createParser(LLMProvider.GEMINI, true);

    const realCaseChunk = `Context text before tools.
[
  { "name": "write_file", "args": { "path": "/memory/a.json", "content": "{\n \"project\": \"Apollo\" }" } },
  { "name": "write_file", "args": { "path": "/memory/b.txt", "content": "Short episode summary." } }
]
Next step:
[ { "name": "CreatePrompt", "args": { "name": "MemoryManager-Prompt", "category": "CognitiveAgents", "prompt_content": "Keep a small working memory. Include {{tools}}." } } ]
Final step:
[ { "name": "CreateAgentDefinition", "args": { "name": "MemoryManager", "role": "Cognitive Memory Manager", "description": "Compresses chat history", "system_prompt_category": "CognitiveAgents", "system_prompt_name": "MemoryManager-Prompt", "tool_names": "write_file,read_file,BashExecutor" } } ]`;

    parser.processChunks([realCaseChunk]);
    parser.finalize();

    const toolCalls = segments.filter(s => s.type === 'tool_call');
    expect(toolCalls.length).toBe(4);

    expect(segments).toEqual([
      expect.objectContaining({ type: 'text' }),
      expect.objectContaining({ type: 'tool_call', toolName: 'write_file' }),
      expect.objectContaining({ type: 'tool_call', toolName: 'write_file' }),
      expect.objectContaining({ type: 'text' }),
      expect.objectContaining({ type: 'tool_call', toolName: 'CreatePrompt' }),
      expect.objectContaining({ type: 'text' }),
      expect.objectContaining({ type: 'tool_call', toolName: 'CreateAgentDefinition' }),
    ]);

    const createPromptCall = toolCalls.find(s => (s as ToolCallSegment).toolName === 'CreatePrompt') as ToolCallSegment;
    expect(createPromptCall).toBeDefined();
    expect(createPromptCall.arguments.name).toBe('MemoryManager-Prompt');
    expect(createPromptCall.arguments.prompt_content).toContain('Keep a small working memory');
    expect(createPromptCall.arguments.prompt_content).toContain('{{tools}}');

    const createAgentCall = toolCalls.find(s => (s as ToolCallSegment).toolName === 'CreateAgentDefinition') as ToolCallSegment;
    expect(createAgentCall).toBeDefined();
    expect(createAgentCall.arguments.name).toBe('MemoryManager');
    expect(createAgentCall.arguments.tool_names).toBe('write_file,read_file,BashExecutor');
  });

  it('should correctly parse another complex real-world Gemini response with a single large tool call', () => {
    const parser = createParser(LLMProvider.GEMINI, true);

    // This chunk still contains escaped characters inside prompt_content but is far shorter.
    const realLifeChunk = `Will now create prompt. JSON:
{ "name": "CreatePrompt", "args": { "name": "ChemistryTeacher_V2", "category": "AgentSystem", "prompt_content": "You are a chemistry teacher. Grade answers, explain mistakes, and stay friendly. Example: balance H2 + O2 -> H2O." } }
END`;

    parser.processChunks([realLifeChunk]);
    parser.finalize();

    expect(segments.length).toBe(3); // text, tool_call, text
    expect(segments[0]).toEqual({
      type: 'text',
      content: 'Will now create prompt. JSON:\n'
    });
    expect(segments[1].type).toBe('tool_call');
    expect(segments[2]).toEqual({
      type: 'text',
      content: '\nEND'
    });

    const toolCall = segments[1] as ToolCallSegment;
    expect(toolCall.toolName).toBe('CreatePrompt');
    expect(toolCall.arguments.name).toBe('ChemistryTeacher_V2');
    expect(toolCall.arguments.category).toBe('AgentSystem');
    expect(toolCall.arguments.prompt_content).toContain('chemistry teacher');
    expect(toolCall.arguments.prompt_content).toContain('balance H2 + O2 -> H2O');
    // Check for correct parsing of escaped content
    expect(toolCall.arguments.prompt_content).toContain('Grade answers');
  });

  it('should correctly parse a complete HTML document into a complete iframe segment', () => {
    const parser = createParser(LLMProvider.ANTHROPIC, true);
    const htmlDoc = '<!doctype html><html><body><p>Hello</p></body></html>';
    const chunks = [
      'Here is the document: ',
      htmlDoc,
      ' That is all.',
    ];
    parser.processChunks(chunks);
    parser.finalize();

    expect(segments).toEqual([
      { type: 'text', content: 'Here is the document: ' },
      { type: 'iframe', content: htmlDoc, isComplete: true },
      { type: 'text', content: ' That is all.' },
    ]);
  });

  it('should parse an incomplete HTML document into an incomplete iframe segment', () => {
    const parser = createParser(LLMProvider.ANTHROPIC, true);
    const incompleteHtml = '<!doctype html><html><body><p>Uh oh';
    const chunks = [ 'Response: ', incompleteHtml ];
    
    parser.processChunks(chunks);
    parser.finalize();

    expect(segments.length).toBe(2);
    expect(segments[0]).toEqual({ type: 'text', content: 'Response: ' });
    
    const iframeSegment = segments[1] as IframeSegment;
    expect(iframeSegment.type).toBe('iframe');
    expect(iframeSegment.content).toBe(incompleteHtml);
    expect(iframeSegment.isComplete).toBe(false);
  });
});
