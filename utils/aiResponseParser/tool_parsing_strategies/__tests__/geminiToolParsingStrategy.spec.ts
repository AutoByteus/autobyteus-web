import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { GeminiToolParsingStrategy } from '../geminiToolParsingStrategy';
import { ParserContext } from '../../stateMachine/ParserContext';
import type { AIResponseSegment, ToolCallSegment, AIResponseTextSegment } from '../../types';
import { AgentRunState } from '~/types/agent/AgentRunState';
import type { Conversation, AIMessage } from '~/types/conversation';
import { AgentContext } from '~/types/agent/AgentContext';
import type { AgentRunConfig } from '~/types/agent/AgentRunConfig';

vi.mock('~/utils/toolUtils', () => ({
  generateBaseInvocationId: (toolName: string, args: Record<string, any>): string => {
    // Sort keys before stringifying to ensure deterministic IDs for testing
    const sortedArgs = Object.keys(args).sort().reduce((acc, key) => {
      acc[key] = args[key];
      return acc;
    }, {} as Record<string, any>);
    const argString = JSON.stringify(sortedArgs);
    return `call_mock_${toolName}_${argString}`;
  }
}));

vi.mock('~/stores/llmProviderConfig', () => ({
  useLLMProviderConfigStore: vi.fn(() => ({
    getProviderForModel: vi.fn(() => 'gemini'),
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

describe('GeminiToolParsingStrategy (Simplified)', () => {
    let context: ParserContext;
    let segments: AIResponseSegment[];
    let strategy: GeminiToolParsingStrategy;

    beforeEach(() => {
        setActivePinia(createPinia());
        segments = [];
        strategy = new GeminiToolParsingStrategy();
        const agentContext = createMockAgentContext(segments);
        context = new ParserContext(agentContext);
    });

    // --- Signature Checks ---
    it('checkSignature should return "no_match" for non-matching text', () => {
        expect(strategy.checkSignature('{"args":')).toBe('no_match');
        expect(strategy.checkSignature(' some text')).toBe('no_match');
    });

    it('checkSignature should return "partial" for an incomplete signature', () => {
        expect(strategy.checkSignature('{"na')).toBe('partial');
        expect(strategy.checkSignature('[')).toBe('partial');
        expect(strategy.checkSignature('[{"na')).toBe('partial');
    });

    it('checkSignature should return "match" for a complete object signature, ignoring whitespace', () => {
        expect(strategy.checkSignature('  { "name" :')).toBe('match');
    });

    it('checkSignature should return "match" for a complete array signature, ignoring whitespace', () => {
        expect(strategy.checkSignature('  [ { "name" :')).toBe('match');
    });


    // --- Full Stream Test ---
    it('should parse a complete tool call object received at once', () => {
        const signatureBuffer = '{"name":';
        strategy.startSegment(context, signatureBuffer);
        
        const contentStream = `"get_weather", "args": {"location": "Tokyo"}}`;
        for (const char of contentStream) {
            strategy.processChar(char, context);
        }

        strategy.finalize(context);

        expect(strategy.isComplete()).toBe(true);
        expect(segments.length).toBe(1);

        const segment = segments[0] as ToolCallSegment;
        expect(segment.type).toBe('tool_call');
        expect(segment.toolName).toBe('get_weather');
        expect(segment.arguments).toEqual({ location: 'Tokyo' });
        expect(segment.status).toBe('parsed');
        expect(segment.rawJsonContent).toContain('Tokyo');
        expect(segment.invocationId).toBe('call_mock_get_weather_{"location":"Tokyo"}_0');
    });

    it('should parse a real-world tool call wrapped in a list', () => {
        const signatureBuffer = '[{"name":';
        strategy.startSegment(context, signatureBuffer);

        const contentStream = `"ListAvailableTools", "args": {}}]`;
        for (const char of contentStream) {
            strategy.processChar(char, context);
        }
        strategy.finalize(context);

        expect(strategy.isComplete()).toBe(true);
        expect(segments.length).toBe(1);
        const segment = segments[0] as ToolCallSegment;
        expect(segment.toolName).toBe('ListAvailableTools');
        expect(segment.arguments).toEqual({});
        expect(segment.status).toBe('parsed');
    });

    it('should parse a list containing multiple tool calls', () => {
        const signatureBuffer = '[{"name":';
        strategy.startSegment(context, signatureBuffer);

        const contentStream = `"tool1", "args": {"p": 1}}, {"name": "tool2", "args": {"q": 2}}]`;
        for (const char of contentStream) {
            strategy.processChar(char, context);
        }
        strategy.finalize(context);

        expect(strategy.isComplete()).toBe(true);
        expect(segments.length).toBe(2);
        const segment1 = segments[0] as ToolCallSegment;
        const segment2 = segments[1] as ToolCallSegment;
        expect(segment1.toolName).toBe('tool1');
        expect(segment1.arguments).toEqual({ p: 1 });
        expect(segment2.toolName).toBe('tool2');
        expect(segment2.arguments).toEqual({ q: 2 });
    });


    // --- Incremental Stream Test ---
    it('should parse a tool call object received in multiple chunks', () => {
        const signatureBuffer = '{"name":';
        strategy.startSegment(context, signatureBuffer);
        
        expect(segments.length).toBe(1);
        let segment = segments[0] as ToolCallSegment;
        expect(segment.status).toBe('parsing');
        expect(segment.rawJsonContent).toBe(signatureBuffer);

        const streamChunks = [
            '"to',
            'ol1"',
            ',',
            '"ar',
            'gs":',
            '{',
            '"p1":',
            '1',
            '}',
            '}'
        ];

        for (const chunk of streamChunks) {
            for (const char of chunk) {
                strategy.processChar(char, context);
            }
        }

        strategy.finalize(context);
        
        expect(strategy.isComplete()).toBe(true);
        segment = segments[0] as ToolCallSegment;
        expect(segment.status).toBe('parsed');
        expect(segment.toolName).toBe('tool1');
        expect(segment.arguments).toEqual({ p1: 1 });
    });

    // --- Edge Cases ---
    describe('Edge Cases', () => {
        it('should handle an empty args object', () => {
            const signatureBuffer = '{"name":';
            strategy.startSegment(context, signatureBuffer);

            const contentStream = `"tool1", "args":{}}`;
            for (const char of contentStream) {
                strategy.processChar(char, context);
            }
            strategy.finalize(context);
            const segment1 = segments[0] as ToolCallSegment;
            expect(segment1.toolName).toBe('tool1');
            expect(segment1.arguments).toEqual({});
            expect(segment1.status).toBe('parsed');
        });

        it('should revert to a text segment for an incomplete stream', () => {
            const signatureBuffer = '{"name": "tool1", "args": {';
            strategy.startSegment(context, signatureBuffer);
            strategy.finalize(context);
            expect(segments.length).toBe(1);
            expect(segments[0].type).toBe('text');
            expect((segments[0] as AIResponseTextSegment).content).toBe(signatureBuffer);
        });

        it('should revert to a text segment if "name" is missing', () => {
            const stream = '{"args": {}}';
            strategy.startSegment(context, '{"args":');
            for(const char of ' {}}') strategy.processChar(char, context);
            strategy.finalize(context);
            expect(segments.length).toBe(1);
            expect(segments[0].type).toBe('text');
            expect((segments[0] as AIResponseTextSegment).content).toBe(stream);
        });

        it('should revert to a text segment if "name" is not a string', () => {
            const stream = '{"name": 123, "args": {}}';
            strategy.startSegment(context, '{"name":');
            for(const char of ' 123, "args": {}}') strategy.processChar(char, context);
            strategy.finalize(context);
            expect(segments.length).toBe(1);
            expect(segments[0].type).toBe('text');
            expect((segments[0] as AIResponseTextSegment).content).toBe(stream);
        });

        it('should revert to a text segment if "args" is not an object', () => {
            const stream = '{"name": "test", "args": "invalid"}';
            strategy.startSegment(context, '{"name":');
            for(const char of ' "test", "args": "invalid"}') strategy.processChar(char, context);
            strategy.finalize(context);
            expect(segments.length).toBe(1);
            expect(segments[0].type).toBe('text');
            expect((segments[0] as AIResponseTextSegment).content).toBe(stream);
        });

        it('should revert to a text segment if "args" is an array', () => {
            const stream = '{"name": "test", "args": []}';
            strategy.startSegment(context, '{"name":');
            for(const char of ' "test", "args": []}') strategy.processChar(char, context);
            strategy.finalize(context);
            expect(segments.length).toBe(1);
            expect(segments[0].type).toBe('text');
            expect((segments[0] as AIResponseTextSegment).content).toBe(stream);
        });
    });
});
