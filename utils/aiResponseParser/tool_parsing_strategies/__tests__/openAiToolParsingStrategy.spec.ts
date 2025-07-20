import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OpenAiToolParsingStrategy } from '../openAiToolParsingStrategy';
import { ParserContext } from '../../stateMachine/ParserContext';
import { LLMProvider } from '~/types/llm';
import type { AIResponseSegment, ToolCallSegment } from '../../types';
import { AgentInstanceContext } from '~/types/agentInstanceContext';

vi.mock('~/utils/toolUtils', () => ({
  generateBaseInvocationId: (toolName: string, args: Record<string, any>): string => {
    const argString = JSON.stringify(Object.keys(args).sort().reduce((acc, key) => ({...acc, [key]: args[key]}), {}));
    return `call_mock_${toolName}_${argString}`;
  }
}));

describe('OpenAiToolParsingStrategy', () => {
    let context: ParserContext;
    let segments: AIResponseSegment[];
    let strategy: OpenAiToolParsingStrategy;
    let agentContext: AgentInstanceContext;

    beforeEach(() => {
        segments = [];
        strategy = new OpenAiToolParsingStrategy();
        agentContext = new AgentInstanceContext('test-conv-id');
        // FIXED: Updated ParserContext constructor call
        context = new ParserContext(segments, strategy, false, true, agentContext);
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
        strategy.startSegment(context, stream);
        strategy.finalize(context);

        const segment = segments[0] as ToolCallSegment;
        expect(segment.toolName).toBe('write_file');
        expect(segment.arguments).toEqual({path: '/test.txt'});
    });
    
    it('should handle escaped quotes within argument strings', () => {
        const stream = `{"tool_calls": [{"function": {"name": "echo", "arguments": "{\\"text\\":\\"He said \\\\\\\"Hello!\\\\\\\"\\"}"}}]}`;
        strategy.startSegment(context, stream);
        strategy.finalize(context);

        const segment = segments[0] as ToolCallSegment;
        expect(segment.arguments).toEqual({ text: 'He said "Hello!"' });
    });
});
