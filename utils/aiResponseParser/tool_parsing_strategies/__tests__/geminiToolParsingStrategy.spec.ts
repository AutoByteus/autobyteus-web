import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GeminiToolParsingStrategy } from '../geminiToolParsingStrategy';
import { ParserContext } from '../../stateMachine/ParserContext';
import type { AIResponseSegment, ToolCallSegment, AIResponseTextSegment } from '../../types';
import { AgentInstanceContext } from '~/types/agentInstanceContext';

vi.mock('~/utils/toolUtils', () => ({
  generateBaseInvocationId: (toolName: string, args: Record<string, any>): string => {
    const argString = JSON.stringify(Object.keys(args).sort().reduce((acc, key) => ({...acc, [key]: args[key]}), {}));
    return `call_mock_${toolName}_${argString}`;
  }
}));

describe('GeminiToolParsingStrategy (Simplified)', () => {
    let context: ParserContext;
    let segments: AIResponseSegment[];
    let strategy: GeminiToolParsingStrategy;
    let agentContext: AgentInstanceContext;

    beforeEach(() => {
        segments = [];
        strategy = new GeminiToolParsingStrategy();
        agentContext = new AgentInstanceContext('test-conv-id');
        context = new ParserContext(segments, strategy, false, true, agentContext);
    });

    // --- Signature Checks ---
    it('checkSignature should return "no_match" for non-matching text', () => {
        expect(strategy.checkSignature('{"args":')).toBe('no_match');
        expect(strategy.checkSignature('[{"name":')).toBe('no_match');
    });

    it('checkSignature should return "partial" for an incomplete signature', () => {
        expect(strategy.checkSignature('{"na')).toBe('partial');
    });

    it('checkSignature should return "match" for a complete signature, ignoring whitespace', () => {
        expect(strategy.checkSignature('  { "name" :')).toBe('match');
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

        it('should return no invocations for an incomplete stream', () => {
            const signatureBuffer = '{"name": "tool1", "args": {';
            strategy.startSegment(context, signatureBuffer);
            strategy.finalize(context);
            // FIX: Expect a text segment, not an empty array
            expect(segments.length).toBe(1);
            expect(segments[0].type).toBe('text');
            expect((segments[0] as AIResponseTextSegment).content).toBe(signatureBuffer);
        });

        it('should return no invocations if "name" is missing', () => {
            const stream = '{"args": {}}';
            strategy.startSegment(context, stream);
            strategy.finalize(context);
            // FIX: Expect a text segment, not an empty array
            expect(segments.length).toBe(1);
            expect(segments[0].type).toBe('text');
            expect((segments[0] as AIResponseTextSegment).content).toBe(stream);
        });

        it('should return no invocations if "name" is not a string', () => {
            const stream = '{"name": 123, "args": {}}';
            strategy.startSegment(context, stream);
            strategy.finalize(context);
            // FIX: Expect a text segment, not an empty array
            expect(segments.length).toBe(1);
            expect(segments[0].type).toBe('text');
            expect((segments[0] as AIResponseTextSegment).content).toBe(stream);
        });

        it('should return no invocations if "args" is not an object', () => {
            const stream = '{"name": "test", "args": "invalid"}';
            strategy.startSegment(context, stream);
            strategy.finalize(context);
            // FIX: Expect a text segment, not an empty array
            expect(segments.length).toBe(1);
            expect(segments[0].type).toBe('text');
            expect((segments[0] as AIResponseTextSegment).content).toBe(stream);
        });

        it('should return no invocations if "args" is an array', () => {
            const stream = '{"name": "test", "args": []}';
            strategy.startSegment(context, stream);
            strategy.finalize(context);
            // FIX: Expect a text segment, not an empty array
            expect(segments.length).toBe(1);
            expect(segments[0].type).toBe('text');
            expect((segments[0] as AIResponseTextSegment).content).toBe(stream);
        });

        it('should ignore a JSON array of tool calls', () => {
            const stream = `[{"name": "tool1", "args":{}}]`;
            const match = strategy.checkSignature(stream);
            expect(match).toBe('no_match');
        });
    });
});
