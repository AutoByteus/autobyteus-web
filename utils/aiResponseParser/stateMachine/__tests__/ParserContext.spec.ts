import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { ParserContext } from '../ParserContext';
import type { AIResponseSegment, ToolCallSegment } from '../../types';
import type { ToolInvocation } from '~/types/tool-invocation';
import { AgentRunState } from '~/types/agent/AgentRunState';
import type { Conversation, AIMessage } from '~/types/conversation';
import { AgentContext } from '~/types/agent/AgentContext';
import type { AgentRunConfig } from '~/types/agent/AgentRunConfig';

// Helper for creating deterministic JSON strings, same as in incrementalAIResponseParser.spec.ts
const deterministicJsonStringify = (value: any): string => {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(deterministicJsonStringify).join(',')}]`;
  }
  const keys = Object.keys(value).sort();
  const pairs = keys.map(key => {
    const k = JSON.stringify(key);
    const v = deterministicJsonStringify(value[key]);
    return `${k}:${v}`;
  });
  return `{${pairs.join(',')}}`;
};


// Mock the base ID generator to make tests predictable
vi.mock('~/utils/toolUtils', () => ({
  generateBaseInvocationId: (toolName: string, args: Record<string, any>): string => {
    // FIX: Use a fully recursive, whitespace-free stringify to ensure deterministic IDs
    const argString = deterministicJsonStringify(args);
    return `call_base_${toolName}_${argString}`;
  }
}));

vi.mock('~/stores/llmProviderConfig', () => ({
  useLLMProviderConfigStore: vi.fn(() => ({
    getProviderForModel: vi.fn(() => 'default'),
  })),
}));

const createMockAgentContext = (segments: AIResponseSegment[]): AgentContext => {
  const conversation: Conversation = { id: 'test-conv-id', messages: [], createdAt: '', updatedAt: '' };
  const lastAIMessage: AIMessage = { type: 'ai', text: '', timestamp: new Date(), chunks: [], segments, isComplete: false, parserInstance: null as any };
  conversation.messages.push(lastAIMessage);
  const agentState = new AgentRunState('test-conv-id', conversation);
  const agentConfig: AgentRunConfig = { launchProfileId: '', workspaceId: null, llmModelIdentifier: 'test-model', autoExecuteTools: false, parseToolCalls: true, useXmlToolFormat: false };
  return new AgentContext(agentConfig, agentState);
};

describe('ParserContext', () => {
  let segments: AIResponseSegment[];
  let context: ParserContext;

  beforeEach(() => {
    setActivePinia(createPinia());
    segments = [];
    const agentContext = createMockAgentContext(segments);
    context = new ParserContext(agentContext);
  });

  describe('Text Segments', () => {
    it('should append a new text segment', () => {
      context.appendTextSegment('Hello');
      expect(segments).toEqual([{ type: 'text', content: 'Hello' }]);
    });

    it('should merge with the last text segment', () => {
      context.appendTextSegment('Hello');
      context.appendTextSegment(' World');
      expect(segments).toEqual([{ type: 'text', content: 'Hello World' }]);
    });

    it('should create a new text segment after a non-text segment', () => {
      context.startFileSegment('test.txt');
      context.appendTextSegment('Some text');
      expect(segments.length).toBe(2);
      expect(segments[1]).toEqual({ type: 'text', content: 'Some text' });
    });

    it('should not append an empty text segment', () => {
      context.appendTextSegment('');
      expect(segments).toEqual([]);
    });
  });

  describe('File Segments', () => {
    it('should start and append to a file segment', () => {
      context.startFileSegment('test.js');
      expect(segments[0].type).toBe('file');
      
      context.appendToFileSegment('console.log("hello");');
      const fileSegment = segments[0] as any;
      expect(fileSegment.path).toBe('test.js');
      expect(fileSegment.language).toBe('javascript');
      expect(fileSegment.originalContent).toBe('console.log("hello");');
    });
  });

  describe('XML Tool Segments', () => {
    it('should manage the lifecycle of an XML tool call segment with unique IDs', () => {
      context.startXmlToolCallSegment('test_tool');
      let toolSegment = segments[0] as ToolCallSegment;
      expect(toolSegment.type).toBe('tool_call');
      expect(toolSegment.toolName).toBe('test_tool');
      expect(toolSegment.status).toBe('parsing');
      // Initial ID is now a placeholder
      expect(toolSegment.invocationId).toBe('temp-xml-id');

      context.updateCurrentToolArguments({ param: 'value' });
      toolSegment = segments[0] as ToolCallSegment;
      expect(toolSegment.arguments).toEqual({ param: 'value' });
      
      context.endCurrentToolSegment();
      toolSegment = segments[0] as ToolCallSegment;
      expect(toolSegment.status).toBe('parsed');
      // ID is generated for the first time with final args, so suffix is _0
      expect(toolSegment.invocationId).toBe('call_base_test_tool_{"param":"value"}_0');
    });
  });

  describe('JSON Tool Segments', () => {
    it('should finalize a JSON segment with one unique invocation', () => {
      context.startJsonToolCallSegment();
      expect(segments[0].status).toBe('parsing');

      const invocations: ToolInvocation[] = [
        { name: 'json_tool', arguments: { id: 1 } }
      ];
      context.finalizeJsonSegment(invocations);

      const toolSegment = segments[0] as ToolCallSegment;
      expect(segments.length).toBe(1);
      expect(toolSegment.status).toBe('parsed');
      expect(toolSegment.toolName).toBe('json_tool');
      expect(toolSegment.arguments).toEqual({ id: 1 });
      expect(toolSegment.invocationId).toBe('call_base_json_tool_{"id":1}_0');
    });

    it('should finalize a JSON segment with multiple unique invocations', () => {
      context.startJsonToolCallSegment();
      const invocations: ToolInvocation[] = [
        { name: 'tool1', arguments: { a: 1 } },
        { name: 'tool2', arguments: { b: 2 } }
      ];
      context.finalizeJsonSegment(invocations);

      expect(segments.length).toBe(2);
      const firstSegment = segments[0] as ToolCallSegment;
      const secondSegment = segments[1] as ToolCallSegment;

      expect(firstSegment.toolName).toBe('tool1');
      expect(firstSegment.status).toBe('parsed');
      expect(firstSegment.invocationId).toBe('call_base_tool1_{"a":1}_0');

      expect(secondSegment.toolName).toBe('tool2');
      expect(secondSegment.status).toBe('parsed');
      expect(secondSegment.invocationId).toBe('call_base_tool2_{"b":2}_0');
    });

    it('should remove the parsing segment if finalization yields no invocations', () => {
      context.startJsonToolCallSegment();
      expect(segments.length).toBe(1);

      context.finalizeJsonSegment([]); // No invocations parsed
      expect(segments.length).toBe(0);
    });
  });
});
