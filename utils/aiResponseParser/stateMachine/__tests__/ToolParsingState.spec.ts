import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { ToolParsingState } from '../ToolParsingState';
import { TextState } from '../TextState';
import { ParserContext } from '../ParserContext';
import type { AIResponseSegment, ToolCallSegment } from '../../types';
import { AgentRunState } from '~/types/agent/AgentRunState';
import type { Conversation, AIMessage } from '~/types/conversation';
import { AgentContext } from '~/types/agent/AgentContext';
import type { AgentRunConfig } from '~/types/agent/AgentRunConfig';
import { StreamScanner } from '../StreamScanner';
import { StateMachine } from '../StateMachine';

vi.mock('~/utils/toolUtils', () => ({
  generateBaseInvocationId: (toolName: string, args: Record<string, any>): string => {
    const argString = JSON.stringify(args);
    return `call_base_${toolName}_${argString}`;
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
  const agentConfig: AgentRunConfig = { launchProfileId: '', workspaceId: null, llmModelIdentifier: 'anthropic-model', autoExecuteTools: false, parseToolCalls: true, useXmlToolFormat: true };
  return new AgentContext(agentConfig, agentState);
};

describe('ToolParsingState', () => {
  let segments: AIResponseSegment[];
  let context: ParserContext;
  let machine: StateMachine;

  beforeEach(() => {
    setActivePinia(createPinia());
    segments = [];
    const agentContext = createMockAgentContext(segments);
    context = new ParserContext(agentContext);
    machine = new StateMachine(context);
  });

  describe('Strategy Selection', () => {
    it('should select FileWriterXmlToolParsingStrategy and parse raw content correctly', () => {
      const rawContent = '<div>\n  <p>This is raw text, not nested XML.</p>\n</div>';
      const stream = `<tool name="FileWriter"><arguments><arg name="content">${rawContent}</arg></arguments></tool>`;
      
      machine.appendChunks([stream]);
      machine.run();
      machine.finalize();

      expect(segments.length).toBe(1);
      const toolSegment = segments[0] as ToolCallSegment;
      expect(toolSegment.type).toBe('tool_call');
      expect(toolSegment.toolName).toBe('FileWriter');
      // Key assertion: The content is treated as a single, raw string because the correct strategy was chosen.
      expect(toolSegment.arguments.content).toBe(rawContent);
    });

    it('should select generic XmlToolParsingStrategy and parse nested XML content correctly', () => {
      const nestedContent = `<arg name="param">value</arg>`;
      const stream = `<tool name="GenericTool"><arguments><arg name="data">${nestedContent}</arg></arguments></tool>`;

      machine.appendChunks([stream]);
      machine.run();
      machine.finalize();

      expect(segments.length).toBe(1);
      const toolSegment = segments[0] as ToolCallSegment;
      expect(toolSegment.type).toBe('tool_call');
      expect(toolSegment.toolName).toBe('GenericTool');
      // Key assertion: The content is parsed as a nested object because the generic strategy was chosen.
      expect(toolSegment.arguments.data).toEqual({
        param: 'value'
      });
    });
  });
});