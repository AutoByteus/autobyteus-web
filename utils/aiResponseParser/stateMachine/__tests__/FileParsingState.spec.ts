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
  const agentConfig: AgentRunConfig = { launchProfileId: '', workspaceId: null, llmModelIdentifier: 'test-model', autoExecuteTools: false, parseToolCalls: true, useXmlToolFormat: false };
  return new AgentContext(agentConfig, agentState);
};

describe('FileParsingState (as Sub-Machine Runner)', () => {
  let segments: AIResponseSegment[];
  let context: ParserContext;

  beforeEach(() => {
    setActivePinia(createPinia());
    segments = [];
    const agentContext = createMockAgentContext(segments);
    context = new ParserContext(agentContext);
  });

  it('should parse a complete, valid file block and transition back to TextState', () => {
    const input = ' path="src/main.js">\nconsole.log("hello");\n</file>...remaining text';
    // In a real run, XmlTagInitializationState would have consumed '<file' and transitioned to FileParsingState.
    // The FileParsingState is responsible for parsing from the space after '<file'.
    // @ts-ignore - Directly setting the scanner for test purposes
    context.scanner = new StreamScanner(input);
    context.currentState = new FileParsingState(context);
    context.currentState.run();

    // Check segment
    expect(segments.length).toBe(1);
    const fileSegment = segments[0] as FileSegment;
    expect(fileSegment.type).toBe('file');
    expect(fileSegment.path).toBe('src/main.js');
    expect(fileSegment.originalContent).toBe('console.log("hello");\n');

    // Check state transition
    expect(context.currentState).toBeInstanceOf(TextState);

    // Check scanner position
    expect(context.substring(context.getPosition())).toBe('...remaining text');
  });

  it('should revert to a text segment for a malformed file block and transition back', () => {
    const input = ' no_path="true">content</file>';
    // @ts-ignore - Directly setting the scanner for test purposes
    context.scanner = new StreamScanner(input);
    context.currentState = new FileParsingState(context);
    context.currentState.run();

    // The sub-machine fails, so the state should revert the content to text.
    // The reverted text is '<file' + ' no_path="true">'.
    expect(segments).toEqual([
      { type: 'text', content: '<file no_path="true">' }
    ]);

    // It should still transition back to TextState to continue.
    expect(context.currentState).toBeInstanceOf(TextState);

    // The scanner should be positioned after the malformed opening tag.
    // The sub-machine consumes until '>', then fails.
    expect(context.substring(context.getPosition())).toBe('content</file>');
  });

  it('should not transition if the stream is incomplete', () => {
    const input = ' path="a.txt">console.log("hello"'; // No closing tag
    // @ts-ignore - Directly setting the scanner for test purposes
    context.scanner = new StreamScanner(input);
    context.currentState = new FileParsingState(context);
    context.currentState.run();

    // It has parsed what it can, but the sub-machine is not complete.
    expect(segments.length).toBe(1);
    const fileSegment = segments[0] as FileSegment;
    expect(fileSegment.originalContent).toBe('console.log("hello"');

    // The state should NOT transition away from FileParsingState.
    expect(context.currentState).toBeInstanceOf(FileParsingState);
  });
});
