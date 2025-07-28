import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { DefaultJsonToolParsingStrategy } from '../defaultJsonToolParsingStrategy';
import { ParserContext } from '../../stateMachine/ParserContext';
import type { AIResponseSegment, ToolCallSegment, AIResponseTextSegment } from '../../types';
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
    getProviderForModel: vi.fn(() => 'default'),
  })),
}));

const createMockAgentContext = (segments: AIResponseSegment[]): AgentContext => {
  const conversation: Conversation = { id: 'test-conv-id', messages: [], createdAt: '', updatedAt: '' };
  const lastAIMessage: AIMessage = { type: 'ai', text: '', timestamp: new Date(), chunks: [], segments, isComplete: false, parserInstance: null as any };
  conversation.messages.push(lastAIMessage);
  const agentState = new AgentRunState('test-conv-id', conversation);
  const agentConfig: AgentRunConfig = { launchProfileId: '', workspaceId: null, llmModelName: 'test-model', autoExecuteTools: false, useXmlToolFormat: false, parseToolCalls: true };
  return new AgentContext(agentConfig, agentState);
};

describe('DefaultJsonToolParsingStrategy', () => {
    let context: ParserContext;
    let segments: AIResponseSegment[];
    let strategy: DefaultJsonToolParsingStrategy;

    beforeEach(() => {
        setActivePinia(createPinia());
        segments = [];
        strategy = new DefaultJsonToolParsingStrategy();
        const agentContext = createMockAgentContext(segments);
        context = new ParserContext(agentContext);
    });

    it('should parse a single tool call from a real example, streamed in chunks', () => {
        const signatureBuffer = '{"tool":';
        strategy.startSegment(context, signatureBuffer);
        
        const chunks = [
            ' ',
            '{',
            '\n',
            '    ',
            '"',
            'fun',
            'ct',
            'ion',
            '"',
            ':',
            ' ',
            '"',
            'sqlite',
            '_',
            'list_t',
            'ables',
            '"',
            ',',
            '\n',
            '    "p',
            'aram',
            'eters":',
            ' {',
            '}',
            '\n  }',
            '\n}'
        ];

        for (const chunk of chunks) {
            for (const char of chunk) {
                strategy.processChar(char, context);
            }
        }
        
        strategy.finalize(context);

        expect(strategy.isComplete()).toBe(true);
        expect(segments.length).toBe(1);

        const segment = segments[0] as ToolCallSegment;
        expect(segment.type).toBe('tool_call');
        expect(segment.toolName).toBe('sqlite_list_tables');
        expect(segment.arguments).toEqual({});
        expect(segment.status).toBe('parsed');
        expect(segment.invocationId).toBe('call_mock_sqlite_list_tables_{}_0');
    });

    describe('Edge Cases', () => {
        it('should return no invocations for incomplete JSON', () => {
            const signatureBuffer = '{"tool": {';
            strategy.startSegment(context, signatureBuffer);
            strategy.finalize(context);
            // FIX: Expect a text segment, not an empty array
            expect(segments.length).toBe(1);
            expect(segments[0].type).toBe('text');
            expect((segments[0] as AIResponseTextSegment).content).toBe(signatureBuffer);
        });

        it('should return no invocations if "function" is missing', () => {
            const stream = '{"tool": {"parameters": {}}}';
            strategy.startSegment(context, '{"tool":');
            for (const char of ' {"parameters": {}}}') {
                strategy.processChar(char, context);
            }
            strategy.finalize(context);
            // FIX: Expect a text segment, not an empty array
            expect(segments.length).toBe(1);
            expect(segments[0].type).toBe('text');
            expect((segments[0] as AIResponseTextSegment).content).toBe(stream);
        });

        it('should return no invocations if "function" is not a string', () => {
            const stream = '{"tool": {"function": 123, "parameters": {}}}';
            strategy.startSegment(context, '{"tool":');
            for (const char of ' {"function": 123, "parameters": {}}}') {
                strategy.processChar(char, context);
            }
            strategy.finalize(context);
            // FIX: Expect a text segment, not an empty array
            expect(segments.length).toBe(1);
            expect(segments[0].type).toBe('text');
            expect((segments[0] as AIResponseTextSegment).content).toBe(stream);
        });

        it('should return no invocations if "parameters" is not an object', () => {
            const stream = '{"tool": {"function": "test", "parameters": "not-an-object"}}';
            strategy.startSegment(context, '{"tool":');
            for (const char of ' {"function": "test", "parameters": "not-an-object"}}') {
                strategy.processChar(char, context);
            }
            strategy.finalize(context);
            // FIX: Expect a text segment, not an empty array
            expect(segments.length).toBe(1);
            expect(segments[0].type).toBe('text');
            expect((segments[0] as AIResponseTextSegment).content).toBe(stream);
        });

        it('should return no invocations if "tool" is not an object', () => {
            const stream = '{"tool": "invalid"}';
            strategy.startSegment(context, '{"tool":');
            for (const char of ' "invalid"}') {
                strategy.processChar(char, context);
            }
            strategy.finalize(context);
            // FIX: Expect a text segment, not an empty array
            expect(segments.length).toBe(1);
            expect(segments[0].type).toBe('text');
            expect((segments[0] as AIResponseTextSegment).content).toBe(stream);
        });
    });
});
