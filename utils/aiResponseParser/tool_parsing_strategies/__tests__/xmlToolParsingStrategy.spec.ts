import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { XmlToolParsingStrategy } from '../xmlToolParsingStrategy';
import { ParserContext } from '../../stateMachine/ParserContext';
import type { AIResponseSegment, ToolCallSegment } from '../../types';
import { AgentRunState } from '~/types/agent/AgentRunState';
import type { Conversation, AIMessage } from '~/types/conversation';
import { AgentContext } from '~/types/agent/AgentContext';
import type { AgentRunConfig } from '~/types/agent/AgentRunConfig';

// Mock the invocation ID generator for predictable test results
vi.mock('~/utils/toolUtils', () => ({
  generateBaseInvocationId: (toolName: string, args: Record<string, any>): string => {
    // FIX: Sort keys before stringifying to ensure deterministic IDs
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
    getProviderForModel: vi.fn(() => 'anthropic'),
  })),
}));

const createMockAgentContext = (segments: AIResponseSegment[]): AgentContext => {
  const conversation: Conversation = { id: 'test-conv-id', messages: [], createdAt: '', updatedAt: '' };
  const lastAIMessage: AIMessage = { type: 'ai', text: '', timestamp: new Date(), chunks: [], segments, isComplete: false, parserInstance: null as any };
  conversation.messages.push(lastAIMessage);
  const agentState = new AgentRunState('test-conv-id', conversation);
  const agentConfig: AgentRunConfig = { launchProfileId: '', workspaceId: null, llmModelName: 'test-model', autoExecuteTools: false, parseToolCalls: true };
  return new AgentContext(agentConfig, agentState);
};

describe('XmlToolParsingStrategy', () => {
    let context: ParserContext;
    let segments: AIResponseSegment[];
    let strategy: XmlToolParsingStrategy;

    beforeEach(() => {
        setActivePinia(createPinia());
        segments = [];
        strategy = new XmlToolParsingStrategy();
        const agentContext = createMockAgentContext(segments);
        context = new ParserContext(agentContext);
    });

    // --- Signature Checks ---
    it('checkSignature should return "no_match" for non-matching text', () => {
        expect(strategy.checkSignature('<file>')).toBe('no_match');
        expect(strategy.checkSignature('tool')).toBe('no_match');
    });

    it('checkSignature should return "partial" for an incomplete signature', () => {
        expect(strategy.checkSignature('<to')).toBe('partial');
    });

    it('checkSignature should return "match" for a complete signature', () => {
        expect(strategy.checkSignature('<tool')).toBe('match');
    });
    
    // --- Full Stream Test ---
    it('should parse a complete tool call received at once', () => {
        const signatureBuffer = '<tool';
        strategy.startSegment(context, signatureBuffer);
        
        const contentStream = ` name="write_file"><arguments><arg name="path">/test.txt</arg><arg name="content">Hello World</arg></arguments></tool>`;
        for (const char of contentStream) {
            strategy.processChar(char, context);
        }
        
        strategy.finalize(context);

        expect(strategy.isComplete()).toBe(true);
        expect(segments.length).toBe(1);

        const segment = segments[0] as ToolCallSegment;
        expect(segment.type).toBe('tool_call');
        expect(segment.toolName).toBe('write_file');
        expect(segment.arguments).toEqual({
            path: '/test.txt',
            content: 'Hello World'
        });
        expect(segment.status).toBe('parsed');
        expect(segment.invocationId).toBe('call_mock_write_file_{"content":"Hello World","path":"/test.txt"}_0');
    });

    // --- Incremental Stream Test ---
    it('should parse a tool call received in multiple chunks', () => {
        const signatureBuffer = '<tool';
        strategy.startSegment(context, signatureBuffer);
        
        let segment = segments[0] as ToolCallSegment;
        expect(segment.status).toBe('parsing');
        expect(segment.toolName).toBe('');

        const streamChunks = [
            ' name="edit',
            '_file">',
            '<arguments>',
            '<arg name="path">',
            '/src/main',
            '.js</arg>',
            '<arg name="content">co',
            'nsole.log("hello");',
            '</arg>',
            '</arguments>',
            '</t',
            'ool>'
        ];

        for (const chunk of streamChunks) {
            for (const char of chunk) {
                strategy.processChar(char, context);
            }
        }
        
        strategy.finalize(context);
        
        expect(strategy.isComplete()).toBe(true);
        segment = segments[0] as ToolCallSegment;
        expect(segment.toolName).toBe('edit_file');
        expect(segment.status).toBe('parsed');
        expect(segment.arguments).toEqual({
            path: '/src/main.js',
            content: 'console.log("hello");'
        });
    });

    it('should parse a tool call with no arguments and an XML comment', () => {
        const signatureBuffer = '<tool';
        strategy.startSegment(context, signatureBuffer);
        
        const contentStream = ` name="sqlite_list_tables">\n    <!-- This tool takes no arguments -->\n</tool>`;

        for (const char of contentStream) {
            strategy.processChar(char, context);
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

    it('should stream argument values character by character', () => {
        const signatureBuffer = '<tool';
        strategy.startSegment(context, signatureBuffer);
        
        // Stream up to the start of an argument value
        const preContentStream = ` name="echo"><arguments><arg name="text">`;
        for (const char of preContentStream) {
            strategy.processChar(char, context);
        }
    
        const segment = segments[0] as ToolCallSegment;
        expect(segment.arguments['text']).toBeDefined();
        expect(segment.arguments['text']).toBe('');
    
        // Stream first character of value
        strategy.processChar('H', context);
        expect(segment.arguments['text']).toBe('H');
    
        // Stream second character
        strategy.processChar('i', context);
        expect(segment.arguments['text']).toBe('Hi');
    
        // Stream the rest
        const postContentStream = `</arg></arguments></tool>`;
        for (const char of postContentStream) {
            strategy.processChar(char, context);
        }
        strategy.finalize(context);
    
        expect(segment.status).toBe('parsed');
        expect(segment.arguments).toEqual({ text: 'Hi' });
    });

    // --- Edge Cases ---
    it('should handle arguments containing XML-like syntax', () => {
        const signatureBuffer = '<tool';
        strategy.startSegment(context, signatureBuffer);

        const contentStream = ` name="comment_code"><arguments><arg name="comment"><!-- <p>This is an HTML comment</p> --></arg></arguments></tool>`;
        for (const char of contentStream) {
            strategy.processChar(char, context);
        }
        
        strategy.finalize(context);

        expect(strategy.isComplete()).toBe(true);
        const segment = segments[0] as ToolCallSegment;
        expect(segment.arguments).toEqual({
            comment: '<!-- <p>This is an HTML comment</p> -->'
        });
    });

    it('should not be complete if stream ends prematurely', () => {
        const signatureBuffer = '<tool';
        strategy.startSegment(context, signatureBuffer);

        const contentStream = ` name="incomplete_tool"><arguments><arg name="path">/test.txt</arg>`; // Missing closing tags
        for (const char of contentStream) {
            strategy.processChar(char, context);
        }

        expect(strategy.isComplete()).toBe(false);
        const segment = segments[0] as ToolCallSegment;
        expect(segment.status).toBe('parsing');
    });
});
