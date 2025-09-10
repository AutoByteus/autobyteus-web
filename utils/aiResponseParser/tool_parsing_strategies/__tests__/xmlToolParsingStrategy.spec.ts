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
    getProviderForModel: vi.fn(() => 'anthropic'),
  })),
}));

const createMockAgentContext = (segments: AIResponseSegment[]): AgentContext => {
  const conversation: Conversation = { id: 'test-conv-id', messages: [], createdAt: '', updatedAt: '' };
  const lastAIMessage: AIMessage = { type: 'ai', text: '', timestamp: new Date(), chunks: [], segments, isComplete: false, parserInstance: null as any };
  conversation.messages.push(lastAIMessage);
  const agentState = new AgentRunState('test-conv-id', conversation);
  const agentConfig: AgentRunConfig = { launchProfileId: '', workspaceId: null, llmModelIdentifier: 'test-model', autoExecuteTools: false, parseToolCalls: true, useXmlToolFormat: true };
  return new AgentContext(agentConfig, agentState);
};

describe('XmlToolParsingStrategy (State Machine)', () => {
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

    const runStream = (stream: string) => {
        const toolStartIndex = stream.indexOf('<tool');
        if (toolStartIndex === -1) throw new Error("Test stream must contain '<tool'");
        
        const signatureBuffer = '<tool';
        strategy.startSegment(context, signatureBuffer);

        const contentStream = stream.substring(toolStartIndex + signatureBuffer.length);
        for (const char of contentStream) {
            strategy.processChar(char, context);
        }
        strategy.finalize(context);
    }

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
        const stream = `<tool name="write_file"><arguments><arg name="path">/test.txt</arg><arg name="content">Hello World</arg></arguments></tool>`;
        runStream(stream);

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

    it('should parse a tool call with no arguments', () => {
        const stream = `<tool name="list_files"><arguments></arguments></tool>`;
        runStream(stream);

        expect(strategy.isComplete()).toBe(true);
        const segment = segments[0] as ToolCallSegment;
        expect(segment.toolName).toBe('list_files');
        expect(segment.arguments).toEqual({});
        expect(segment.status).toBe('parsed');
        expect(segment.invocationId).toBe('call_mock_list_files_{}_0');
    });

    it('should correctly decode XML entities in argument values', () => {
        const stream = `<tool name="test"><arguments><arg name="code">1 &lt; 2 &amp;&amp; 3 &gt; 1</arg><arg name="quotes">&quot;Hello&quot; &apos;World&apos;</arg></arguments></tool>`;
        runStream(stream);

        const segment = segments[0] as ToolCallSegment;
        expect(segment.arguments).toEqual({
            code: '1 < 2 && 3 > 1',
            quotes: '"Hello" \'World\''
        });
    });

    it('should handle arguments containing XML-like syntax as a string', () => {
        const stream = `<tool name="comment_code"><arguments><arg name="comment"><!-- <p>This is a comment</p> --></arg></arguments></tool>`;
        runStream(stream);

        const segment = segments[0] as ToolCallSegment;
        expect(segment.arguments).toEqual({
            comment: '<!-- <p>This is a comment</p> -->'
        });
    });

    it('should not be complete if stream ends prematurely and should revert to text', () => {
        const stream = `<tool name="incomplete_tool"><arguments><arg name="path">/test.txt</arg>`;
        runStream(stream);

        expect(strategy.isComplete()).toBe(false);
        expect(segments.length).toBe(1);
        expect(segments[0].type).toBe('text');
        // The reverted text should contain the full attempted parse
        expect((segments[0].content as string)).toContain('<tool name="incomplete_tool">');
    });
    
    describe('Nested and List Structures', () => {
        it('should parse nested objects (arg inside arg)', () => {
            const stream = `
                <tool name="NestedTool">
                    <arguments>
                        <arg name="config">
                            <arg name="setting">true</arg>
                            <arg name="level">5</arg>
                        </arg>
                    </arguments>
                </tool>`;
            runStream(stream);

            const segment = segments[0] as ToolCallSegment;
            expect(segment.toolName).toBe('NestedTool');
            expect(segment.arguments).toEqual({
                config: {
                    setting: 'true',
                    level: '5'
                }
            });
        });

        it('should parse a list of strings using <item> tags', () => {
            const stream = `
                <tool name="ListTool">
                    <arguments>
                        <arg name="items">
                            <item>apple</item>
                            <item>banana</item>
                        </arg>
                    </arguments>
                </tool>`;
            runStream(stream);

            const segment = segments[0] as ToolCallSegment;
            expect(segment.toolName).toBe('ListTool');
            expect(segment.arguments).toEqual({
                items: ['apple', 'banana']
            });
        });

        it('should parse a list of objects', () => {
            const stream = `
                <tool name="ListOfObjectsTool">
                    <arguments>
                        <arg name="tasks">
                            <item>
                                <arg name="task_name">implement_logic</arg>
                                <arg name="status">done</arg>
                            </item>
                             <item>
                                <arg name="task_name">write_docs</arg>
                                <arg name="status">pending</arg>
                            </item>
                        </arg>
                    </arguments>
                </tool>`;
            runStream(stream);

            const segment = segments[0] as ToolCallSegment;
            expect(segment.toolName).toBe('ListOfObjectsTool');
            expect(segment.arguments).toEqual({
                tasks: [
                    { task_name: 'implement_logic', status: 'done' },
                    { task_name: 'write_docs', status: 'pending' }
                ]
            });
        });
        
        it('should correctly handle a mix of nested structures', () => {
            const stream = `
                <tool name="ComplexTool">
                    <arguments>
                        <arg name="name">Project X</arg>
                        <arg name="config">
                            <arg name="retries">3</arg>
                            <arg name="flags">
                                <item>A</item>
                                <item>B</item>
                            </arg>
                        </arg>
                        <arg name="users">
                           <item>
                                <arg name="name">Alice</arg>
                                <arg name="id">101</arg>
                           </item>
                        </arg>
                    </arguments>
                </tool>`;
            runStream(stream);

            const segment = segments[0] as ToolCallSegment;
            expect(segment.toolName).toBe('ComplexTool');
            expect(segment.arguments).toEqual({
                name: 'Project X',
                config: {
                    retries: '3',
                    flags: ['A', 'B']
                },
                users: [
                    { name: 'Alice', id: '101' }
                ]
            });
        });
    });
});