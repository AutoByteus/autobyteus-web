/* autobyteus-web/utils/aiResponseParser/stateMachine/__tests__/FileParsingState.spec.ts */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { FileParsingState } from '../FileParsingState';
import { ParserContext } from '../ParserContext';
import type { AIResponseSegment, FileSegment } from '../../types';
import { AgentRunState } from '~/types/agent/AgentRunState';
import type { Conversation, AIMessage } from '~/types/conversation';
import { AgentContext } from '~/types/agent/AgentContext';
import type { AgentRunConfig } from '~/types/agent/AgentRunConfig';
import { StreamScanner } from '../StreamScanner';
import { TextState } from '../TextState';

vi.mock('~/stores/llmProviderConfig', () => ({
  useLLMProviderConfigStore: vi.fn(() => ({ getProviderForModel: vi.fn(() => 'default') })),
}));

const createMockAgentContext = (segments: AIResponseSegment[]): AgentContext => {
  const conversation: Conversation = { id: 'test-conv-id', messages: [], createdAt: '', updatedAt: '' };
  const lastAIMessage: AIMessage = { type: 'ai', text: '', timestamp: new Date(), chunks: [], segments, isComplete: false, parserInstance: null as any };
  conversation.messages.push(lastAIMessage);
  const agentState = new AgentRunState('test-conv-id', conversation);
  const agentConfig: AgentRunConfig = { launchProfileId: '', workspaceId: null, llmModelIdentifier: 'test-model', autoExecuteTools: false, parseToolCalls: true };
  return new AgentContext(agentConfig, agentState);
};

describe('FileParsingState (as Sub-Machine Runner)', () => {
  let segments: AIResponseSegment[];
  let context: ParserContext;

  function runMachine(input: string) {
    // @ts-ignore - Directly setting the scanner for test purposes
    context.scanner = new StreamScanner(input);
    // The FileParsingState is instantiated with the sub-machine ready to go
    const machine = new FileParsingState(context);
    machine.run();
    return machine;
  }

  beforeEach(() => {
    setActivePinia(createPinia());
    segments = [];
    const agentContext = createMockAgentContext(segments);
    context = new ParserContext(agentContext);
  });

  it('should parse a complete, valid file block and transition back to TextState', () => {
    const input = ' path="src/main.js">\nconsole.log("hello");\n