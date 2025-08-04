import { describe, it, expect, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { StateMachine } from '../StateMachine';
import type { AIResponseSegment } from '../../types';
import { ParserContext } from '../ParserContext';
import { AgentRunState } from '~/types/agent/AgentRunState';
import type { Conversation, AIMessage } from '~/types/conversation';
import { AgentContext } from '~/types/agent/AgentContext';
import type { AgentRunConfig } from '~/types/agent/AgentRunConfig';
import { LLMProvider } from '~/types/llm';

vi.mock('~/utils/toolUtils', () => ({
  generateBaseInvocationId: (toolName: string, args: Record<string, any>): string => {
    const argString = JSON.stringify(Object.keys(args).sort().reduce((acc, key) => ({...acc, [key]: args[key]}), {}));
    return `call_mock_${toolName}_${argString}`;
  }
}));

vi.mock('~/stores/llmProviderConfig', () => ({
  useLLMProviderConfigStore: vi.fn(() => ({
    getProviderForModel: (modelName: string) => {
      if (modelName === 'anthropic') return LLMProvider.ANTHROPIC;
      if (modelName === 'openai') return LLMProvider.OPENAI;
      return LLMProvider.DEFAULT;
    },
  })),
}));

const createMockAgentContext = (
  segments: AIResponseSegment[],
  modelName: string,
  parseToolCalls: boolean
): AgentContext => {
  const conversation: Conversation = { id: 'test-conv-id', messages: [], createdAt: '', updatedAt: '' };
  const lastAIMessage: AIMessage = { type: 'ai', text: '', timestamp: new Date(), chunks: [], segments, isComplete: false, parserInstance: null as any };
  conversation.messages.push(lastAIMessage);
  const agentState = new AgentRunState('test-conv-id', conversation);
  const agentConfig: AgentRunConfig = { launchProfileId: '', workspaceId: null, llmModelName: modelName, autoExecuteTools: false, parseToolCalls };
  return new AgentContext(agentConfig, agentState);
};

describe('StateMachine with a pre-selected Strategy', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should parse a mix of text and XML tags when given XmlToolParsingStrategy', () => {
    const segments: AIResponseSegment[] = [];
    const agentContext = createMockAgentContext(segments, 'anthropic', true);
    const parserContext = new ParserContext(agentContext);
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
    const agentContext = createMockAgentContext(segments, 'openai', true);
    const parserContext = new ParserContext(agentContext);
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
    const agentContext = createMockAgentContext(segments, 'openai', true);
    const parserContext = new ParserContext(agentContext);
    const machine = new StateMachine(parserContext);

    machine.appendChunks(['Some <unknown>tag</unknown> text']);
    machine.run();
    expect(segments).toEqual([
      { type: 'text', content: 'Some <unknown>tag</unknown> text' }
    ]);
  });
});
