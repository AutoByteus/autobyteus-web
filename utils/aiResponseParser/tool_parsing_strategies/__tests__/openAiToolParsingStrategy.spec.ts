import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { OpenAiToolParsingStrategy } from '../openAiToolParsingStrategy';
import { ParserContext } from '../../stateMachine/ParserContext';
import type { AIResponseSegment, ToolCallSegment } from '../../types';
import { AgentRunState } from '~/types/agent/AgentRunState';
import type { Conversation, AIMessage } from '~/types/conversation';
import { AgentContext } from '~/types/agent/AgentContext';
import type { AgentRunConfig } from '~/types/agent/AgentRunConfig';

vi.mock('~/utils/toolUtils', () => ({
  generateBaseInvocationId: (toolName: string, args: Record<string, any>): string => {
    const argString = JSON.stringify(Object.keys(args).sort().reduce((acc, key) => ({...acc, [key]: args[key]}), {}));
    return `call_mock_${toolName}_${argString}`;
  }
}));

vi.mock('~/stores/llmProviderConfig', () => ({
  useLLMProviderConfigStore: vi.fn(() => ({
    getProviderForModel: vi.fn(() => 'openai'),
  })),
}));

const createMockAgentContext = (segments: AIResponseSegment[]): AgentContext => {
  const conversation: Conversation = { id: 'test-conv-id', messages: [], createdAt: '', updatedAt: '' };
  const lastAIMessage: AIMessage = { type: 'ai', text: '', timestamp: new Date(), chunks: [], segments, isComplete: false, parserInstance: null as any };
  conversation.messages.push(lastAIMessage);
  const agentState = new AgentRunState('test-conv-id', conversation);
  const agentConfig: AgentRunConfig = { launchProfileId: '', workspaceId: null, llmModelIdentifier: 'test-model', autoExecuteTools: false, parseToolCalls: true };
  return new AgentContext(agentConfig, agentState);
};


describe('OpenAiToolParsingStrategy', () => {
    let context: ParserContext;
    let segments: AIResponseSegment[];
    let strategy: OpenAiToolParsingStrategy;

    beforeEach(() => {
        setActivePinia(createPinia());
        segments = [];
        strategy = new OpenAiToolParsingStrategy();
        const agentContext = createMockAgentContext(segments);
        context = new ParserContext(agentContext);
    });

    it('checkSignature should return "match" for a "tool_calls" signature', () => {
        expect(strategy.checkSignature('  { "tool_calls": ')).toBe('match');
    });

    it('checkSignature should return "match" for a "tools" signature', () => {
        expect(strategy.checkSignature('{"tools":')).toBe('match');
    });

    it('checkSignature should return "match" for a "tool" signature', () => {
        expect(strategy.checkSignature(' { "tool" :')).toBe('match');
    });

    it('checkSignature should return "no_match" for other JSON objects', () => {
        expect(strategy.checkSignature('{"key": "value"}')).toBe('no_match');
    });

    it('checkSignature should return "partial" for an incomplete but potential signature', () => {
        expect(strategy.checkSignature('{"to')).toBe('partial');
    });

    it('should parse the official OpenAI format with a "tool_calls" array', () => {
        const stream = `{"tool_calls": [{"function": {"name": "write_file", "arguments": "{\\"path\\":\\"/test.txt\\"}"}}]}`;
        strategy.startSegment(context, '{"tool_calls":');
        for (const char of `[{"function": {"name": "write_file", "arguments": "{\\"path\\":\\"/test.txt\\"}"}}]}`) {
            strategy.processChar(char, context);
        }
        strategy.finalize(context);

        const segment = segments[0] as ToolCallSegment;
        expect(segment.toolName).toBe('write_file');
        expect(segment.arguments).toEqual({path: '/test.txt'});
    });
    
    it('should handle escaped quotes within argument strings', () => {
        const stream = `{"tool_calls": [{"function": {"name": "echo", "arguments": "{\\"text\\":\\"He said \\\\\\\"Hello!\\\\\\\"\\"}"}}]}`;
        strategy.startSegment(context, '{"tool_calls":');
        for (const char of `[{"function": {"name": "echo", "arguments": "{\\"text\\":\\"He said \\\\\\\"Hello!\\\\\\\"\\"}"}}]}`) {
            strategy.processChar(char, context);
        }
        strategy.finalize(context);

        const segment = segments[0] as ToolCallSegment;
        expect(segment.arguments).toEqual({ text: 'He said "Hello!"' });
    });
});
