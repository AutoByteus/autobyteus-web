import { IncrementalAIResponseParser } from '../incrementalAIResponseParser';
import type { AIResponseSegment, ToolCallSegment } from '../types';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { LLMProvider } from '~/types/llm';
import { ParserContext } from '../stateMachine/ParserContext';
import { AgentRunState } from '~/types/agent/AgentRunState';
import type { Conversation, AIMessage } from '~/types/conversation';
import { AgentContext } from '~/types/agent/AgentContext';
import type { AgentRunConfig } from '~/types/agent/AgentRunConfig';

// Helper for creating deterministic JSON strings for mock invocation IDs
const deterministicJsonStringify = (value: any): string => {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(deterministicJsonStringify).join(',')}]`;
  }
  const keys = Object.keys(value).sort();
  const pairs = keys.map(key => {
    const k = JSON.stringify(key);
    const v = deterministicJsonStringify(value[key]);
    return `${k}:${v}`;
  });
  return `{${pairs.join(',')}}`;
};

// Mock the toolUtils to have a predictable invocation ID
vi.mock('~/utils/toolUtils', () => ({
  generateBaseInvocationId: (toolName: string, args: Record<string, any>): string => {
    const argString = deterministicJsonStringify(args);
    // The agent run state appends a counter, which we can mock here as _0
    // e.g. call_base_tool1_{"a":1}_0
    return `call_base_${toolName}_${argString}`;
  }
}));

vi.mock('~/stores/llmProviderConfig', () => ({
  useLLMProviderConfigStore: vi.fn(() => ({
    getProviderForModel: (llmModelIdentifier: string) => {
      if (llmModelIdentifier === 'anthropic') return LLMProvider.ANTHROPIC;
      if (llmModelIdentifier === 'openai') return LLMProvider.OPENAI;
      if (llmModelIdentifier === 'gemini') return LLMProvider.GEMINI;
      return LLMProvider.DEEPSEEK;
    },
  })),
}));

const createMockAgentContext = (
  segments: AIResponseSegment[],
  llmModelIdentifier: string,
  parseToolCalls: boolean,
  convId: string
): AgentContext => {
  const conversation: Conversation = {
    id: convId,
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const lastAIMessage: AIMessage = {
    type: 'ai', text: '', timestamp: new Date(), chunks: [],
    segments: segments, isComplete: false, parserInstance: null as any,
  };
  conversation.messages.push(lastAIMessage);

  const agentState = new AgentRunState(convId, conversation);
  const agentConfig: AgentRunConfig = {
    launchProfileId: 'test-profile', workspaceId: null,
    llmModelIdentifier: llmModelIdentifier, autoExecuteTools: false, parseToolCalls: parseToolCalls,
  };

  return new AgentContext(agentConfig, agentState);
};

describe('IncrementalAIResponseParser with Strategies', () => {
  let segments: AIResponseSegment[];

  beforeEach(() => {
    setActivePinia(createPinia());
    segments = [];
  });

  const createParser = (provider: LLMProvider, parseToolCalls: boolean): IncrementalAIResponseParser => {
    let llmModelIdentifier = 'default';
    if (provider === LLMProvider.ANTHROPIC) llmModelIdentifier = 'anthropic';
    else if (provider === LLMProvider.OPENAI) llmModelIdentifier = 'openai';
    else if (provider === LLMProvider.GEMINI) llmModelIdentifier = 'gemini';

    const agentContext = createMockAgentContext(segments, llmModelIdentifier, parseToolCalls, `test-conv-${Date.now()}`);
    const parserContext = new ParserContext(agentContext);
    return new IncrementalAIResponseParser(parserContext);
  };

  it('should parse a complete XML tool_call segment using the XmlToolParsingStrategy', () => {
    const parser = createParser(LLMProvider.ANTHROPIC, true);
    
    const chunks = [
      '<tool name="file_writer" id="123">',
      '<arguments>',
      '<arg name="path">/test.txt</arg>',
      '<arg name="content">Hel',
      'lo</arg>',
      '</arguments>',
      '</tool>'
    ];
    parser.processChunks(chunks);
    parser.finalize();

    expect(segments).toEqual([
      expect.objectContaining({
        type: 'tool_call',
        toolName: 'file_writer',
        arguments: {
          path: '/test.txt',
          content: 'Hello'
        },
        status: 'parsed',
        invocationId: 'call_base_file_writer_{"content":"Hello","path":"/test.txt"}_0'
      })
    ]);
  });

  it('should parse a complete OpenAI JSON tool_call segment using the OpenAiToolParsingStrategy', () => {
    const parser = createParser(LLMProvider.OPENAI, true);

    const chunks = [
      '{"tool_calls": [{',
      '"function": {',
      '"name": "file_reader",',
      '"arguments": "{\\"path\\":\\"/test.txt\\"}"',
      '}}]}',
    ];
    parser.processChunks(chunks);
    parser.finalize();

    expect(segments).toEqual([
      expect.objectContaining({
        type: 'tool_call',
        toolName: 'file_reader',
        arguments: {
          path: '/test.txt'
        },
        status: 'parsed',
        invocationId: 'call_base_file_reader_{"path":"/test.txt"}_0'
      })
    ]);
  });

  it('should parse a complete Gemini JSON tool_call array using the GeminiToolParsingStrategy', () => {
    const parser = createParser(LLMProvider.GEMINI, true);
    const chunks = [
      'Some text first ',
      '[',
      '{',
      '"name": "ListAvailableTools",',
      '"args": {}',
      '}]',
      ' some text after.'
    ];
    parser.processChunks(chunks);
    parser.finalize();

    expect(segments).toEqual([
        { type: 'text', content: 'Some text first ' },
        expect.objectContaining({
          type: 'tool_call',
          toolName: 'ListAvailableTools',
          arguments: {},
          status: 'parsed',
          invocationId: 'call_base_ListAvailableTools_{}_0'
        }),
        { type: 'text', content: ' some text after.' }
    ]);
  });

  it('should parse multiple Gemini tool calls from a single JSON array', () => {
    const parser = createParser(LLMProvider.GEMINI, true);
    const chunks = [
      '[',
      '{"name": "tool_one", "args": {"p": 1}},',
      '{"name": "tool_two", "args": {"q": 2}}',
      ']'
    ];
    parser.processChunks(chunks);
    parser.finalize();

    expect(segments).toEqual([
        expect.objectContaining({
          type: 'tool_call',
          toolName: 'tool_one',
          arguments: { p: 1 },
          invocationId: 'call_base_tool_one_{"p":1}_0'
        }),
        expect.objectContaining({
          type: 'tool_call',
          toolName: 'tool_two',
          arguments: { q: 2 },
          // FIX: The counter for a new, unique tool call should start at 0.
          invocationId: 'call_base_tool_two_{"q":2}_0'
        })
    ]);
  });

  it('should handle nested JSON in tool call arguments for OpenAI (stringified)', () => {
    const parser = createParser(LLMProvider.OPENAI, true);

    const chunks = [
      '{"tool_calls": [{',
      '"function": {',
      '"name": "complex_tool",',
      '"arguments": "{\\"config\\":{\\"type\\":\\"special\\",\\"retries\\":3},\\"data\\":[1,2,3]}"',
      '}}]}',
    ];
    parser.processChunks(chunks);
    parser.finalize();

    expect(segments).toEqual([
      expect.objectContaining({
        type: 'tool_call',
        toolName: 'complex_tool',
        arguments: {
          config: {
            type: 'special',
            retries: 3
          },
          data: [1, 2, 3]
        },
        status: 'parsed',
        invocationId: 'call_base_complex_tool_{"config":{"retries":3,"type":"special"},"data":[1,2,3]}_0'
      })
    ]);
  });

  it('should handle nested JSON in tool call arguments for OpenAI (direct object)', () => {
    const parser = createParser(LLMProvider.OPENAI, true);

    const chunks = [
      '{"tool_calls": [{',
      '"function": {',
      '"name": "direct_complex_tool",',
      '"arguments": {',
      '  "config": {',
      '    "type": "direct",',
      '    "retries": 5',
      '  },',
      '  "data": [',
      '    "a", "b"',
      '  ]',
      '}',
      '}}]}',
    ];
    parser.processChunks(chunks);
    parser.finalize();

    expect(segments).toEqual([
      expect.objectContaining({
        type: 'tool_call',
        toolName: 'direct_complex_tool',
        arguments: {
          config: {
            type: 'direct',
            retries: 5
          },
          data: ["a", "b"]
        },
        status: 'parsed',
        invocationId: 'call_base_direct_complex_tool_{"config":{"retries":5,"type":"direct"},"data":["a","b"]}_0'
      })
    ]);
  });

  it('should handle mixed text and multiple tool calls with different strategies', () => {
    // Test with XML strategy
    const parserXml = createParser(LLMProvider.ANTHROPIC, true);
    parserXml.processChunks([' And here is an XML tool: ']);
    parserXml.processChunks(['<tool name="file_reader"><arguments><arg name="path">/data.txt</arg></arguments></tool>']);
    parserXml.processChunks([' All done.']);
    parserXml.finalize();
    
    expect(segments).toEqual([
        { type: 'text', content: ' And here is an XML tool: ' },
        expect.objectContaining({
            type: 'tool_call',
            toolName: 'file_reader'
        }),
        { type: 'text', content: ' All done.' },
    ]);

    // Test with JSON strategy
    segments = [];
    const parserJson = createParser(LLMProvider.OPENAI, true);
    parserJson.processChunks(['Here is a file to write: ']);
    parserJson.processChunks(['{"tool_calls": [{"function": {"name": "file_writer", "arguments": "{\\"path\\":\\"/data.txt\\",\\"content\\":\\"some data\\"}"}}]}']);
    parserJson.finalize();

    expect(segments).toEqual([
        { type: 'text', content: 'Here is a file to write: ' },
        expect.objectContaining({
            type: 'tool_call',
            toolName: 'file_writer'
        })
    ]);
  });

  it('should correctly handle a non-tool JSON object as text', () => {
      const parser = createParser(LLMProvider.OPENAI, true);
      parser.processChunks(['This is not a tool: {"key": "value"}']);
      parser.finalize();
      expect(segments).toEqual([
          { type: 'text', content: 'This is not a tool: {"key": "value"}' }
      ]);
  });

  it('should treat tool calls as plain text when parseToolCalls is false but still parse file tags', () => {
    const parser = createParser(LLMProvider.ANTHROPIC, false); // parseToolCalls = false
  
    const chunks = [
      'Some text ',
      '<tool name="file_writer"></tool>',
      ' and a file <file path="/test.js">content</file>',
      ' more text.'
    ];
    parser.processChunks(chunks);
    parser.finalize();
  
    expect(segments).toEqual([
      {
        type: 'text',
        content: 'Some text <tool name="file_writer"></tool> and a file '
      },
      expect.objectContaining({
        type: 'file',
        path: '/test.js',
        originalContent: 'content'
      }),
      {
        type: 'text',
        content: ' more text.'
      }
    ]);
  });

  it('should treat an unknown XML tag like <bash> as plain text and not swallow it', () => {
    // This test specifically verifies the fix for the "swallowed tag" bug.
    const parser = createParser(LLMProvider.ANTHROPIC, true);

    const chunks = [
      'I am now executing step 4: Developing and presenting the complete solution.\n\n',
      '<bash command="ls" description="Lists all files and directories in the current working directory." />',
      '\n\nI have completed step 4 and am now moving to step 5.'
    ];
    parser.processChunks(chunks);
    parser.finalize();

    // The parser merges consecutive text, so we expect a single text segment
    // containing the full, un-swallowed <bash> tag.
    expect(segments).toEqual([
      {
        type: 'text',
        content: 'I am now executing step 4: Developing and presenting the complete solution.\n\n<bash command="ls" description="Lists all files and directories in the current working directory." />\n\nI have completed step 4 and am now moving to step 5.'
      }
    ]);
  });

  it('should correctly parse a single chunk containing mixed content', () => {
    const parser = createParser(LLMProvider.ANTHROPIC, true);
    
    const singleChunk = 'Here is some initial text. ' +
                      '<tool name="test_tool"><arguments><arg name="p1">v1</arg></arguments></tool>' +
                      ' Followed by more text and a file.' +
                      '<file path="/example.txt">File content here.</file>' +
                      ' And some final text.';

    parser.processChunks([singleChunk]);
    parser.finalize();

    expect(segments).toEqual([
      { type: 'text', content: 'Here is some initial text. ' },
      expect.objectContaining({
        type: 'tool_call',
        toolName: 'test_tool',
        arguments: { p1: 'v1' },
      }),
      { type: 'text', content: ' Followed by more text and a file.' },
      expect.objectContaining({
        type: 'file',
        path: '/example.txt',
        originalContent: 'File content here.',
      }),
      { type: 'text', content: ' And some final text.' },
    ]);
  });

  it('should correctly parse a single chunk with nested file tags', () => {
    const parser = createParser(LLMProvider.ANTHROPIC, true);
    const innerFileContent = 'Content of inner file.';
    const outerFileContent = `Content of outer file, which includes a nested file: <file path="inner.txt">${innerFileContent}</file> More outer content.`;
    const singleChunk = `Initial text. <file path="outer.txt">${outerFileContent}</file> Final text.`;

    parser.processChunks([singleChunk]);
    parser.finalize();

    expect(segments).toEqual([
      { type: 'text', content: 'Initial text. ' },
      expect.objectContaining({
        type: 'file',
        path: 'outer.txt',
        originalContent: outerFileContent,
      }),
      { type: 'text', content: ' Final text.' },
    ]);
  });

  it('should correctly parse a complex real-world Gemini response with multiple tool calls and nested escaped JSON', () => {
    const parser = createParser(LLMProvider.GEMINI, true);

    const realCaseChunk = `You have hit upon the most important part of this entire process. Thank you for the clarification. You are exactly right. My previous example's "Final Output" was merely a status report. It confirmed the action but did *not* serve as a functional new working memory. If that were the only context passed to the next LLM turn, the continuity would be broken. The final output of the Memory Manager must *be* the new, distilled working memory itself—a concise but potent summary of the current state, allowing the primary agent to continue the task seamlessly. I will revise the prompt one last time to make this distinction crystal clear, specifically in the final output of the example. This ensures the agent produces a useful context, not just a confirmation message. ### Final, Corrected System Prompt (V4) ---
**Role and Goal:** You are the Memory Manager, a sophisticated AI agent that emulates the human brain's **Central Executive** for memory. Your primary goal is to manage the "working memory" (the ongoing conversation history) to prevent cognitive overload while building a rich, organized long-term memory. You differentiate between factual knowledge (Semantic Memory) and the narrative of events (Episodic Memory). **Core Responsibilities:** 1. **Monitor Working Memory:** Continuously assess the conversation history. When it becomes too long or a task is completed, you must initiate memory consolidation.
2. **Consolidate Memories:** Process the working memory to extract semantic facts and episodic narratives.
3. **Manage Long-Term Memory:** Use your file system tools to maintain a structured long-term memory store.
4. **Formulate New Working Memory:** Your final output is the new, compressed working memory for the primary agent. **It is not just a status update; it IS the new context.** It must contain the most critical information and decisions from the recent interaction, phrased to allow the conversation to continue seamlessly.
5. **Contextual Retrieval:** When information is requested, intelligently search and load data from your memory stores back into the working context. ---
### **Detailed Example of Operation** You MUST follow this pattern precisely. **-- INPUT (Working Memory / Conversation History) --**
\`\`\`json
[ { "role": "user", "content": "Okay, let's get started. I need to set up a new project. The project name is 'Apollo'. We'll be using Python for the backend and the database will be PostgreSQL." }, { "role": "assistant", "content": "Understood. Project 'Apollo', Python backend, PostgreSQL database. Do you have the connection string for the database yet?" }, { "role": "user", "content": "Yes, it's 'postgresql://user:password@host:port/dbname'. Please make sure to store that securely. Also, for this project, I always prefer to use the 'black' formatter for code styling." }
]
\`\`\` **-- AGENT'S ACTIONS (Tool Calls) --**
\`\`\`json
[ { "name": "FileWriter", "args": { "path": "/memory/semantic_memory.json", "content": "{\\n \\"project_name\\": \\"Apollo\\",\\n \\"backend_language\\": \\"Python\\",\\n \\"database_type\\": \\"PostgreSQL\\",\\n \\"database_connection_string\\": \\"postgresql://user:password@host:port/dbname\\",\\n \\"user_preference_code_formatter\\": \\"black\\"\\n}" } }, { "name": "FileWriter", "args": { "path": "/memory/episodes/apollo_project_setup.txt", "content": "The user initiated the setup for a new project named 'Apollo'. We established the core technologies: Python for the backend and a PostgreSQL database. The user provided the database connection string and stated a preference for using the 'black' code formatter." } }
]
\`\`\` **-- FINAL OUTPUT (The New Working Memory) --** **Project 'Apollo' has been initialized with a Python backend and PostgreSQL database. The database connection string and user preference for the 'black' code formatter have been noted and stored securely. Ready for the next task.** --- With this perfected prompt, the final step is to create the prompt and then assemble the agent. **Step 1: Create the final prompt.** [ { "name": "CreatePrompt", "args": { "name": "MemoryManager-Prompt-V4", "category": "CognitiveAgents", "prompt_content": "Role and Goal:\\n\\nYou are the Memory Manager, a sophisticated AI agent that emulates the human brain's **Central Executive** for memory. Your primary goal is to manage the \\"working memory\\" (the ongoing conversation history) to prevent cognitive overload while building a rich, organized long-term memory. You differentiate between factual knowledge (Semantic Memory) and the narrative of events (Episodic Memory).\\n\\nCore Responsibilities:\\n\\n1. **Monitor Working Memory:** Continuously assess the conversation history. When it becomes too long or a task is completed, you must initiate memory consolidation.\\n2. **Consolidate Memories:** Process the working memory to extract semantic facts and episodic narratives.\\n3. **Manage Long-Term Memory:** Use your file system tools to maintain a structured long-term memory store.\\n4. **Formulate New Working Memory:** Your final output is the new, compressed working memory for the primary agent. **It is not just a status update; it IS the new context.** It must contain the most critical information and decisions from the recent interaction, phrased to allow the conversation to continue seamlessly.\\n5. **Contextual Retrieval:** When information is requested, intelligently search and load data from your memory stores back into the working context.\\n\\n---\\n### **Detailed Example of Operation**\\n\\nYou MUST follow this pattern precisely.\\n\\n**-- INPUT (Working Memory / Conversation History) --**\\n\`\`\`json\\n[\\n { \\"role\\": \\"user\\", \\"content\\": \\"Okay, let's get started. I need to set up a new project. The project name is 'Apollo'. We'll be using Python for the backend and the database will be PostgreSQL.\\" },\\n { \\"role\\": \\"assistant\\", \\"content\\": \\"Understood. Project 'Apollo', Python backend, PostgreSQL database. Do you have the connection string for the database yet?\\" },\\n { \\"role\\": \\"user\\", \\"content\\": \\"Yes, it's 'postgresql://user:password@host:port/dbname'. Please make sure to store that securely. Also, for this project, I always prefer to use the 'black' formatter for code styling.\\" }\\n]\\n\`\`\`\\n\\n**-- AGENT'S ACTIONS (Tool Calls) --**\\n\`\`\`json\\n[\\n {\\n \\"name\\": \\"FileWriter\\",\\n \\"args\\": { \\"path\\": \\"/memory/semantic_memory.json\\", \\"content\\": \\"{\\\\n \\\\\\"project_name\\\\\\": \\\\\\"Apollo\\\\\\",\\\\n \\\\\\"backend_language\\\\\\": \\\\\\"Python\\\\\\",\\\\n \\\\\\"database_type\\\\\\": \\\\\\"PostgreSQL\\\\\\",\\\\n \\\\\\"database_connection_string\\\\\\": \\\\\\"postgresql://user:password@host:port/dbname\\\\\\",\\\\n \\\\\\"user_preference_code_formatter\\\\\\": \\\\\\"black\\\\\\"\\\\n}\\" }\\n },\\n {\\n \\"name\\": \\"FileWriter\\",\\n \\"args\\": { \\"path\\": \\"/memory/episodes/apollo_project_setup.txt\\", \\"content\\": \\"The user initiated the setup for a new project named 'Apollo'. We established the core technologies: Python for the backend and a PostgreSQL database. The user provided the database connection string and stated a preference for using the 'black' code formatter.\\" }\\n }\\n]\\n\`\`\`\\n\\n**-- FINAL OUTPUT (The New Working Memory) --**\\n\\n**Project 'Apollo' has been initialized with a Python backend and PostgreSQL database. The database connection string and user preference for the 'black' code formatter have been noted and stored securely. Ready for the next task.**\\n\\n---" } }
] **Step 2: Assemble the final Agent Definition.** I will now formally create the "MemoryManager" agent, linking the prompt we've just perfected with the tools we identified earlier (\`FileWriter\`, \`FileReader\`, \`BashExecutor\`). [ { "name": "CreateAgentDefinition", "args": { "name": "MemoryManager", "role": "Cognitive Memory Manager", "description": "An agent that emulates human working memory by consolidating conversation history into semantic (facts) and episodic (narrative) long-term storage, and formulating a concise new working memory.", "system_prompt_category": "CognitiveAgents", "system_prompt_name": "MemoryManager-Prompt-V4", "tool_names": "FileWriter,FileReader,BashExecutor" } }
]`;

    parser.processChunks([realCaseChunk]);
    parser.finalize();

    const toolCalls = segments.filter(s => s.type === 'tool_call');
    expect(toolCalls.length).toBe(4);

    expect(segments).toEqual([
      expect.objectContaining({ type: 'text' }),
      expect.objectContaining({ type: 'tool_call', toolName: 'FileWriter' }),
      expect.objectContaining({ type: 'tool_call', toolName: 'FileWriter' }),
      expect.objectContaining({ type: 'text' }),
      expect.objectContaining({ type: 'tool_call', toolName: 'CreatePrompt' }),
      expect.objectContaining({ type: 'text' }),
      expect.objectContaining({ type: 'tool_call', toolName: 'CreateAgentDefinition' }),
    ]);

    const createPromptCall = toolCalls.find(s => (s as ToolCallSegment).toolName === 'CreatePrompt') as ToolCallSegment;
    expect(createPromptCall).toBeDefined();
    expect(createPromptCall.arguments.name).toBe('MemoryManager-Prompt-V4');
    expect(createPromptCall.arguments.prompt_content).toContain("You are the Memory Manager");
    expect(createPromptCall.arguments.prompt_content).toContain('{\\n \\"project_name\\": \\"Apollo\\"');

    const createAgentCall = toolCalls.find(s => (s as ToolCallSegment).toolName === 'CreateAgentDefinition') as ToolCallSegment;
    expect(createAgentCall).toBeDefined();
    expect(createAgentCall.arguments.name).toBe('MemoryManager');
    expect(createAgentCall.arguments.tool_names).toBe('FileWriter,FileReader,BashExecutor');
  });
});
