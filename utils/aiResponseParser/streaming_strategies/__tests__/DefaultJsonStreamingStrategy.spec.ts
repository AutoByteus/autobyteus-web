import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DefaultJsonStreamingStrategy } from '../default_json_strategy';
import { ParserContext } from '../../stateMachine/ParserContext';
import { LLMProvider } from '~/types/llm';
import type { AIResponseSegment, ToolCallSegment } from '../../types';

vi.mock('~/utils/toolUtils', () => ({
  generateInvocationId: (toolName: string, args: Record<string, any>): string => {
    const argString = JSON.stringify(Object.keys(args).sort().reduce((acc, key) => ({...acc, [key]: args[key]}), {}));
    return `call_mock_${toolName}_${argString}`;
  }
}));

describe('DefaultJsonStreamingStrategy', () => {
    let context: ParserContext;
    let segments: AIResponseSegment[];
    let strategy: DefaultJsonStreamingStrategy;

    beforeEach(() => {
        segments = [];
        strategy = new DefaultJsonStreamingStrategy();
        context = new ParserContext(segments, strategy, false);
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
        expect(segment.invocationId).toBe('call_mock_sqlite_list_tables_{}');
    });
});
