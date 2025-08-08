import { IncrementalAIResponseParser } from '../incrementalAIResponseParser';
import type { AIResponseSegment } from '../types';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { LLMProvider } from '~/types/llm';
import { ParserContext } from '../stateMachine/ParserContext';
import { AgentRunState } from '~/types/agent/AgentRunState';
import type { Conversation, AIMessage } from '~/types/conversation';
import { AgentContext } from '~/types/agent/AgentContext';
import type { AgentRunConfig } from '~/types/agent/AgentRunConfig';

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

vi.mock('~/stores/llmProviderConfig', () => ({
  useLLMProviderConfigStore: vi.fn(() => ({
    getProviderForModel: (llmModelIdentifier: string) => {
      if (llmModelIdentifier === 'anthropic') return LLMProvider.ANTHROPIC;
      if (llmModelIdentifier === 'openai') return LLMProvider.OPENAI;
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
    const llmModelIdentifier = provider === LLMProvider.ANTHROPIC ? 'anthropic' : 'openai';
    const agentContext = createMockAgentContext(segments, llmModelIdentifier, parseToolCalls, `test-conv-${Date.now()}`);
    const parserContext = new ParserContext(agentContext);
    return new IncrementalAIResponseParser(parserContext);
  };

  it('should parse a complete XML tool_call segment using the XmlToolParsingStrategy', () => {
    const parser = createParser(LLMProvider.ANTHROPIC, true);
    
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
});
