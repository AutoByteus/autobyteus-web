import { describe, it, expect, vi } from 'vitest';
import { StateMachine } from '../StateMachine';
import type { AIResponseSegment } from '../../types';
import { XmlToolParsingStrategy } from '../../tool_parsing_strategies/xmlToolParsingStrategy';
import { OpenAiToolParsingStrategy } from '../../tool_parsing_strategies/openAiToolParsingStrategy';
import { ParserContext } from '../ParserContext';
import { AgentRunState } from '~/types/agent/AgentRunState';
import type { Conversation } from '~/types/conversation';

vi.mock('~/utils/toolUtils', () => ({
  generateBaseInvocationId: (toolName: string, args: Record<string, any>): string => {
    const argString = JSON.stringify(Object.keys(args).sort().reduce((acc, key) => ({...acc, [key]: args[key]}), {}));
    return `call_mock_${toolName}_${argString}`;
  }
}));

const createMockConversation = (id: string): Conversation => ({
  id,
  messages: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

describe('StateMachine with a pre-selected Strategy', () => {
  it('should parse a mix of text and XML tags when given XmlToolParsingStrategy', () => {
    const segments: AIResponseSegment[] = [];
    const mockConversation = createMockConversation('test-conv-id');
    const agentRunState = new AgentRunState('test-conv-id', mockConversation);
    const xmlStrategy = new XmlToolParsingStrategy();
    const parserContext = new ParserContext(segments, xmlStrategy, true, true, agentRunState);
    const machine = new StateMachine(parserContext);

    machine.appendChunks([
      'Intro text ',
      '<tool name="xml_tool"><arguments><arg name="p1">v1</arg></arguments></tool>',
      ' Final text'
    ]);
    machine.run();

    expect(segments).toEqual([
      { type: 'text', content: 'Intro text ' },
      expect.objectContaining({
        type: 'tool_call',
        toolName: 'xml_tool',
        arguments: { p1: 'v1' },
      }),
      { type: 'text', content: ' Final text' }
    ]);
  });

  it('should parse a mix of text and JSON when given OpenAiToolParsingStrategy', () => {
    const segments: AIResponseSegment[] = [];
    const mockConversation = createMockConversation('test-conv-id');
    const agentRunState = new AgentRunState('test-conv-id', mockConversation);
    const openAiStrategy = new OpenAiToolParsingStrategy();
    const parserContext = new ParserContext(segments, openAiStrategy, false, true, agentRunState);
    const machine = new StateMachine(parserContext);

    machine.appendChunks(['Hello {"tool_calls":[{"function":{"name":"test","arguments":"{}"}}]} and done.']);
    machine.run();
    
    expect(segments).toEqual([
        { type: 'text', content: 'Hello ' },
        expect.objectContaining({
            type: 'tool_call',
            toolName: 'test',
            status: 'parsed',
        }),
        { type: 'text', content: ' and done.' },
    ]);
  });

  it('should treat an unknown tag as text', () => {
    const segments: AIResponseSegment[] = [];
    const mockConversation = createMockConversation('test-conv-id');
    const agentRunState = new AgentRunState('test-conv-id', mockConversation);
    const openAiStrategy = new OpenAiToolParsingStrategy();
    const parserContext = new ParserContext(segments, openAiStrategy, false, true, agentRunState);
    const machine = new StateMachine(parserContext);

    machine.appendChunks(['Some <unknown>tag</unknown> text']);
    machine.run();
    expect(segments).toEqual([
      { type: 'text', content: 'Some <unknown>tag</unknown> text' }
    ]);
  });
});
