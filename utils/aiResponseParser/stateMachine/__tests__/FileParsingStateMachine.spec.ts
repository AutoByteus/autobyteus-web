/* autobyteus-web/utils/aiResponseParser/stateMachine/__tests__/FileParsingStateMachine.spec.ts */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { FileParsingStateMachine } from '../FileParsingStateMachine';
import { ParserContext } from '../ParserContext';
import type { AIResponseSegment, FileSegment } from '../../types';
import { AgentRunState } from '~/types/agent/AgentRunState';
import type { Conversation, AIMessage } from '~/types/conversation';
import { AgentContext } from '~/types/agent/AgentContext';
import type { AgentRunConfig } from '~/types/agent/AgentRunConfig';
import { StreamScanner } from '../StreamScanner';

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

describe('FileParsingStateMachine', () => {
  let segments: AIResponseSegment[];
  let context: ParserContext;

  function runMachine(input: string): FileParsingStateMachine {
    // @ts-ignore - Directly setting the scanner for test purposes
    context.scanner = new StreamScanner(input);
    const machine = new FileParsingStateMachine(context);
    machine.run();
    return machine;
  }

  beforeEach(() => {
    setActivePinia(createPinia());
    segments = [];
    const agentContext = createMockAgentContext(segments);
    context = new ParserContext(agentContext);
  });

  it('should parse a complete, valid file block', () => {
    const input = ' path="src/main.js">\nconsole.log("hello");\n</file>...remaining text';
    const machine = runMachine(input);

    expect(machine.isComplete()).toBe(true);
    expect(machine.wasSuccessful()).toBe(true);
    expect(segments.length).toBe(1);
    const fileSegment = segments[0] as FileSegment;
    expect(fileSegment.type).toBe('file');
    expect(fileSegment.path).toBe('src/main.js');
    expect(fileSegment.originalContent).toBe('console.log("hello");\n');
    // Ensure scanner is positioned after the tag
    expect(context.substring(context.getPosition())).toBe('...remaining text');
  });

  it('should handle file blocks with no content', () => {
    const input = ' path="a.txt"></file>';
    const machine = runMachine(input);

    expect(machine.isComplete()).toBe(true);
    expect(machine.wasSuccessful()).toBe(true);
    const fileSegment = segments[0] as FileSegment;
    expect(fileSegment.originalContent).toBe('');
  });

  it('should handle malformed opening tags by invalidating', () => {
    const input = ' no_path="true">content</file>';
    const machine = runMachine(input);

    expect(machine.isComplete()).toBe(true);
    expect(machine.wasSuccessful()).toBe(false);
    expect(segments.length).toBe(0); // No segment should be created
    expect(machine.getFinalTagBuffer()).toBe('<file no_path="true">');
  });

  it('should treat content containing "<" not part of a file tag as text', () => {
    const input = ' path="a.txt">const x = 1 < 2;</file>';
    const machine = runMachine(input);

    expect(machine.isComplete()).toBe(true);
    expect(machine.wasSuccessful()).toBe(true);
    const fileSegment = segments[0] as FileSegment;
    expect(fileSegment.originalContent).toBe('const x = 1 < 2;');
  });

  it('should handle incomplete streams by not completing', () => {
    const input = ' path="a.txt">console.log("hello"'; // No closing tag
    const machine = runMachine(input);

    expect(machine.isComplete()).toBe(false);
    const fileSegment = segments[0] as FileSegment;
    expect(fileSegment.originalContent).toBe('console.log("hello"');
  });
  
  it('should correctly handle the first newline being skipped', () => {
    const input = ' path="test.py">\ndef main():\n  pass\n</file>';
    runMachine(input);
    const fileSegment = segments[0] as FileSegment;
    expect(fileSegment.originalContent).toBe('def main():\n  pass\n');
  });
  
  it('should correctly handle when there is no first newline', () => {
    const input = ' path="test.py">def main():\n  pass\n</file>';
    runMachine(input);
    const fileSegment = segments[0] as FileSegment;
    expect(fileSegment.originalContent).toBe('def main():\n  pass\n');
  });

  describe('Nested File Tags', () => {
    it('should correctly parse a file with a single nested file tag', () => {
      const nestedContent = 'console.log("nested");';
      const nestedFile = `<file path="b.js">${nestedContent}</file>`;
      const outerContent = `console.log("outer");\n${nestedFile}\nconsole.log("more outer");`;
      const input = ` path="a.js">${outerContent}</file>...rest`;

      const machine = runMachine(input);

      expect(machine.isComplete()).toBe(true);
      expect(machine.wasSuccessful()).toBe(true);
      expect(segments.length).toBe(1);
      const fileSegment = segments[0] as FileSegment;
      expect(fileSegment.path).toBe('a.js');
      expect(fileSegment.originalContent).toBe(outerContent);
      expect(context.substring(context.getPosition())).toBe('...rest');
    });

    it('should correctly parse a file with two levels of nesting', () => {
      const innermostFile = `<file path="c.js">level 3</file>`;
      const nestedFile = `<file path="b.js">level 2\n${innermostFile}\nend level 2</file>`;
      const outerContent = `level 1\n${nestedFile}\nend level 1`;
      const input = ` path="a.js">${outerContent}</file>`;

      runMachine(input);

      expect(segments.length).toBe(1);
      const fileSegment = segments[0] as FileSegment;
      expect(fileSegment.path).toBe('a.js');
      expect(fileSegment.originalContent).toBe(outerContent);
    });

    it('should treat a nested empty file tag as content', () => {
      const input = ` path="a.js">Outer<file path="b.js"></file>Outer</file>`;
      runMachine(input);

      expect(segments.length).toBe(1);
      const fileSegment = segments[0] as FileSegment;
      expect(fileSegment.originalContent).toBe('Outer<file path="b.js"></file>Outer');
    });

    it('should not complete if the stream ends mid-nesting', () => {
      const input = ` path="a.js">Outer<file path="b.js">Inner`; // Missing closing tags for both
      const machine = runMachine(input);

      expect(machine.isComplete()).toBe(false);
      expect(segments.length).toBe(1);
      const fileSegment = segments[0] as FileSegment;
      expect(fileSegment.originalContent).toBe('Outer<file path="b.js">Inner');
    });

    it('should not complete if the outer closing tag is missing', () => {
      const input = ` path="a.js">Outer<file path="b.js">Inner</file>`; // Missing outer closing tag
      const machine = runMachine(input);

      expect(machine.isComplete()).toBe(false);
      expect(segments.length).toBe(1);
      const fileSegment = segments[0] as FileSegment;
      expect(fileSegment.originalContent).toBe('Outer<file path="b.js">Inner</file>');
    });
  });
});
