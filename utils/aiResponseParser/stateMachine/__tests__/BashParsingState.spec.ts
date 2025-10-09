import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { StateMachine } from '../StateMachine';
import { ParserContext } from '../ParserContext';
import type { AIResponseSegment, BashCommandSegment } from '../../types';
import { AgentRunState } from '~/types/agent/AgentRunState';
import type { Conversation, AIMessage } from '~/types/conversation';
import { AgentContext } from '~/types/agent/AgentContext';
import type { AgentRunConfig } from '~/types/agent/AgentRunConfig';

vi.mock('~/stores/llmProviderConfig', () => ({
  useLLMProviderConfigStore: vi.fn(() => ({ getProviderForModel: vi.fn(() => 'default') })),
}));

const createMockAgentContext = (segments: AIResponseSegment[]): AgentContext => {
  const conversation: Conversation = { id: 'test-conv-id', messages: [], createdAt: '', updatedAt: '' };
  const lastAIMessage: AIMessage = { type: 'ai', text: '', timestamp: new Date(), chunks: [], segments, isComplete: false, parserInstance: null as any };
  conversation.messages.push(lastAIMessage);
  const agentState = new AgentRunState('test-conv-id', conversation);
  const agentConfig: AgentRunConfig = { launchProfileId: '', workspaceId: null, llmModelIdentifier: 'test-model', autoExecuteTools: false, parseToolCalls: true, useXmlToolFormat: false };
  return new AgentContext(agentConfig, agentState);
};

describe('BashParsingState Integration with StateMachine', () => {
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

  it('should parse a simple bash command', () => {
    machine.appendChunks(['<bash>ls -la</bash>']);
    machine.run();
    machine.finalize();

    expect(segments.length).toBe(1);
    const bashSegment = segments[0] as BashCommandSegment;
    expect(bashSegment.type).toBe('bash_command');
    expect(bashSegment.command).toBe('ls -la');
    expect(bashSegment.description).toBe('');
  });

  it('should parse a bash command with a description comment', () => {
    const input = `<bash>\n# List files in detail\nls -la\n</bash>`;
    machine.appendChunks([input]);
    machine.run();
    machine.finalize();
    
    expect(segments.length).toBe(1);
    const bashSegment = segments[0] as BashCommandSegment;
    expect(bashSegment.type).toBe('bash_command');
    expect(bashSegment.command).toBe('ls -la');
    expect(bashSegment.description).toBe('List files in detail');
  });

  it('should parse a multi-line bash command', () => {
    const command = 'echo "hello"\necho "world"';
    machine.appendChunks([`<bash>${command}</bash>`]);
    machine.run();
    machine.finalize();
    
    expect(segments.length).toBe(1);
    const bashSegment = segments[0] as BashCommandSegment;
    expect(bashSegment.command).toBe(command);
    expect(bashSegment.description).toBe('');
  });
  
  it('should treat an incomplete tag as text upon finalization', () => {
    machine.appendChunks(['<bash>echo "incomplete"']);
    machine.run();
    machine.finalize();
    
    expect(segments.length).toBe(1);
    expect(segments[0]).toEqual({ type: 'text', content: '<bash>echo "incomplete"' });
  });
  
  it('should handle case-insensitivity of the closing tag', () => {
    machine.appendChunks(['<bash>echo "case"</BASH>']);
    machine.run();
    machine.finalize();
    
    expect(segments.length).toBe(1);
    const bashSegment = segments[0] as BashCommandSegment;
    expect(bashSegment.type).toBe('bash_command');
    expect(bashSegment.command).toBe('echo "case"');
  });

  it('should revert to a text segment if only a description comment is present', () => {
    machine.appendChunks(['<bash># This is just a comment</bash>']);
    machine.run();
    machine.finalize();

    expect(segments.length).toBe(1);
    expect(segments[0]).toEqual({ type: 'text', content: '# This is just a comment' });
  });

  it('should handle mixed content correctly', () => {
    machine.appendChunks(['Some text. <bash>ls</bash> More text.']);
    machine.run();
    machine.finalize();
    
    expect(segments.length).toBe(3);
    expect(segments[0]).toEqual({ type: 'text', content: 'Some text. ' });
    expect(segments[1].type).toBe('bash_command');
    expect(segments[2]).toEqual({ type: 'text', content: ' More text.' });
  });
});
