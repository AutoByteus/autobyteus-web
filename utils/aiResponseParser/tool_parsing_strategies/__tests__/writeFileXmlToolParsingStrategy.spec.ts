import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { WriteFileXmlToolParsingStrategy } from '../writeFileXmlToolParsingStrategy';
import { ParserContext } from '../../stateMachine/ParserContext';
import type { AIResponseSegment, ToolCallSegment } from '../../types';
import { AgentRunState } from '~/types/agent/AgentRunState';
import type { Conversation, AIMessage } from '~/types/conversation';
import { AgentContext } from '~/types/agent/AgentContext';
import type { AgentRunConfig } from '~/types/agent/AgentRunConfig';
import { LLMProvider } from '~/types/llm';

vi.mock('~/utils/toolUtils', () => ({
  generateBaseInvocationId: () => 'mock_id',
}));

vi.mock('~/stores/llmProviderConfig', () => ({
  useLLMProviderConfigStore: vi.fn(() => ({
    getProviderForModel: () => LLMProvider.ANTHROPIC,
  })),
}));

const createMockAgentContext = (segments: AIResponseSegment[]): AgentContext => {
  const conversation: Conversation = { id: 'test-conv-id', messages: [], createdAt: '', updatedAt: '' };
  const lastAIMessage: AIMessage = {
    type: 'ai',
    text: '',
    timestamp: new Date(),
    chunks: [],
    segments,
    isComplete: false,
    parserInstance: null as any,
  };
  conversation.messages.push(lastAIMessage);
  const agentState = new AgentRunState('test-conv-id', conversation);
  const agentConfig: AgentRunConfig = {
    launchProfileId: '',
    workspaceId: null,
    llmModelIdentifier: 'anthropic-model',
    autoExecuteTools: false,
    parseToolCalls: true,
    useXmlToolFormat: true,
  };
  return new AgentContext(agentConfig, agentState);
};

describe('WriteFileXmlToolParsingStrategy', () => {
  let segments: AIResponseSegment[];
  let context: ParserContext;
  let strategy: WriteFileXmlToolParsingStrategy;

  function runStrategy(fullTag: string): void {
    const openingTag = fullTag.substring(0, fullTag.indexOf('>') + 1);
    const content = fullTag.substring(fullTag.indexOf('>') + 1);
    strategy.startSegment(context, openingTag);
    for (const char of content) {
      strategy.processChar(char, context);
    }
    strategy.finalize(context);
  }

  beforeEach(() => {
    setActivePinia(createPinia());
    segments = [];
    const agentContext = createMockAgentContext(segments);
    context = new ParserContext(agentContext);
    strategy = new WriteFileXmlToolParsingStrategy();
  });

  it('should parse a complete, valid write_file block', () => {
    const fullTag = '<tool name="write_file"><arguments><arg name="path">a.py</arg><arg name="content">print("hi")</arg></arguments></tool>';
    runStrategy(fullTag);

    expect(strategy.isComplete()).toBe(true);
    const toolSegment = segments[0] as ToolCallSegment;
    expect(toolSegment.toolName).toBe('write_file');
    expect(toolSegment.arguments).toEqual({
      path: 'a.py',
      content: 'print("hi")',
    });
  });

  it('should treat legacy FileWriter payloads as write_file', () => {
    const fullTag = '<tool name="FileWriter"><arguments><arg name="path">legacy.txt</arg><arg name="content">legacy</arg></arguments></tool>';
    runStrategy(fullTag);

    const toolSegment = segments[0] as ToolCallSegment;
    expect(toolSegment.toolName).toBe('write_file');
    expect(toolSegment.arguments).toEqual({
      path: 'legacy.txt',
      content: 'legacy',
    });
  });

  it('should correctly decode XML entities in path but not content', () => {
    const fullTag = '<tool name="write_file"><arguments><arg name="path">a&amp;b.txt</arg><arg name="content">1 &lt; 2 &amp;&amp; "hello"</arg></arguments></tool>';
    runStrategy(fullTag);

    const toolSegment = segments[0] as ToolCallSegment;
    expect(toolSegment.arguments.path).toBe('a&b.txt');
    expect(toolSegment.arguments.content).toBe('1 &lt; 2 &amp;&amp; "hello"');
  });

  describe('Real-World File Content Scenarios', () => {
    it('should handle HTML content as a single raw string value', () => {
      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
</head>
<body>
    <h1>Hello World</h1>
    <p>This is a paragraph with a <a href="#">link</a>.</p>
</body>
</html>`;
      const fullTag = `<tool name="write_file"><arguments><arg name="path">index.html</arg><arg name="content">${htmlContent}</arg></arguments></tool>`;
      runStrategy(fullTag);

      const toolSegment = segments[0] as ToolCallSegment;
      expect(toolSegment.toolName).toBe('write_file');
      expect(toolSegment.arguments.content).toBe(htmlContent);
    });

    it('should handle JSX content with unescaped angle brackets as a single raw string value', () => {
      const jsxContent = `import React from 'react';

const MyComponent = ({ name }) => {
  return (
    <div className="container">
      <h1>Hello, {name}!</h1>
      {items.map(item => <p key={item.id}>{item.text}</p>)}
    </div>
  );
};

export default MyComponent;
`;
      const fullTag = `<tool name="write_file"><arguments><arg name="path">component.jsx</arg><arg name="content">${jsxContent}</arg></arguments></tool>`;
      runStrategy(fullTag);

      const toolSegment = segments[0] as ToolCallSegment;
      expect(toolSegment.toolName).toBe('write_file');
      expect(toolSegment.arguments.content).toBe(jsxContent);
    });

    it('should handle a JSON object as a single raw string value', () => {
      const jsonContent = `{
  "name": "Project Apollo",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.0.0",
    "typescript": "^5.0.0"
  },
  "private": true
}`;
      const fullTag = `<tool name="write_file"><arguments><arg name="path">package.json</arg><arg name="content">${jsonContent}</arg></arguments></tool>`;
      runStrategy(fullTag);

      const toolSegment = segments[0] as ToolCallSegment;
      expect(toolSegment.toolName).toBe('write_file');
      expect(toolSegment.arguments.content).toBe(jsonContent);
    });
  });
});
