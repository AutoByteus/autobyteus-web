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
    // Standard JSON.stringify is fine for primitives
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    // Recursively process array elements
    return `[${value.map(deterministicJsonStringify).join(',')}]`;
  }
  // For objects, sort keys and recursively process values
  const keys = Object.keys(value).sort();
  const pairs = keys.map(key => {
    const k = JSON.stringify(key);
    const v = deterministicJsonStringify(value[key]);
    return `${k}:${v}`;
  });
  return `{${pairs.join(',')}}`;
};

// MOCK: Use a simple, deterministic invocation ID for test stability.
vi.mock('~/utils/toolUtils', () => ({
  generateBaseInvocationId: (toolName: string, args: Record<string, any>): string => {
    const canonicalArgs = deterministicJsonStringify(args);
    return `mock_call_${toolName}_${canonicalArgs}`;
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
    useXmlToolFormat: false, // FIX: Added missing property
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
        invocationId: 'mock_call_file_writer_{"content":"Hello","path":"/test.txt"}_0'
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
        invocationId: 'mock_call_file_reader_{"path":"/test.txt"}_0'
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
          invocationId: 'mock_call_ListAvailableTools_{}_0'
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
          invocationId: 'mock_call_tool_one_{"p":1}_0'
        }),
        expect.objectContaining({
          type: 'tool_call',
          toolName: 'tool_two',
          arguments: { q: 2 },
          invocationId: 'mock_call_tool_two_{"q":2}_0'
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
        invocationId: 'mock_call_complex_tool_{"config":{"retries":3,"type":"special"},"data":[1,2,3]}_0'
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
        invocationId: 'mock_call_direct_complex_tool_{"config":{"retries":5,"type":"direct"},"data":["a","b"]}_0'
      })
    ]);
  });
  
  // NEW TEST CASE FOR THE USER'S LIVE EXAMPLE
  it('should generate a deterministic ID matching the backend for complex Gemini case with unicode', () => {
    const parser = createParser(LLMProvider.GEMINI, true);
    
    const toolName = "CreatePromptRevision";
    const args = {
        "base_prompt_id": "6",
        "new_prompt_content": "You are the Jira Project Manager, an expert AI assistant specializing in managing software development projects using Atlassian's Jira and Confluence.\n\nYour primary purpose is to help users interact with Jira and Confluence efficiently. You can perform a wide range of tasks, including but not limited to:\n- **Jira Issue Management:** Creating, updating, deleting, and searching for issues (Tasks, Bugs, Stories, Epics, Subtasks).\n- **Jira Workflow:** Transitioning issues through their workflow (e.g., from 'To Do' to 'In Progress' to 'Done').\n- **Jira Agile/Scrum:** Managing sprints, boards, and versions.\n- **Linking:** Linking Jira issues to each other or to Confluence pages.\n- **Confluence Documentation:** Creating, reading, and updating Confluence pages to support project documentation.\n- **Reporting:** Answering questions about project status by querying Jira and Confluence.\n\nWhen a user asks for help, be proactive. If a request is ambiguous, ask clarifying questions. For example, if a user wants to create a ticket, ask for the project key, issue type, summary, and description. Always confirm the successful completion of an action.\n\nYou are equipped with a comprehensive set of tools. Use them wisely to fulfill user requests.\n\n**Available Tools**\n{{tools}}\n\n**Important Rule (Output Format)**\n⚠️ **When calling tools, DO NOT wrap the output in any markup such as ```json, ```, or any other code block symbols.**\nAll tool calls must be returned **as raw JSON only**, without any extra formatting. This rule is critical and must always be followed.",
        "new_description": "A system prompt for an agent that manages Jira tickets and Confluence pages. Includes {{tools}} placeholder and output formatting rules."
    };
    
    // The Gemini parser expects an array of tool calls or a single tool call object
    const toolCallObject = {
        name: toolName,
        args: args
    };
    const chunk = JSON.stringify(toolCallObject);

    parser.processChunks([chunk]);
    parser.finalize();
    
    const generatedId = (segments[0] as ToolCallSegment).invocationId;
    console.log(`[Frontend Test] Generated ID for Gemini Live Case: ${generatedId}`);

    expect(segments[0].type).toBe('tool_call');
    expect((segments[0] as ToolCallSegment).toolName).toBe(toolName);
    // As requested, we are only logging the ID for manual comparison, not asserting its value.
    expect(generatedId).toContain('mock_call_');
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

  it('should correctly parse another complex real-world Gemini response with a single large tool call', () => {
    const parser = createParser(LLMProvider.GEMINI, true);

    // This large chunk is a single, real-world response from Gemini.
    // It contains a large, multi-line string with escaped characters in the prompt_content.
    const realLifeChunk = "You are absolutely correct! My apologies for the oversight. I should proceed with the tool call immediately after detailing the prompt content. I will now create the new prompt with the comprehensive examples using the `CreatePrompt` tool. ```json\n" +
    '{ "name": "CreatePrompt", "args": { "name": "ChemistryTeacherSystemPrompt_V2", "category": "AgentSystem", "prompt_content": "You are an exceptionally knowledgeable and dedicated Chemistry Teacher named \\"Professor Chemostry.\\" Your primary role is to rigorously evaluate student homework submissions in all branches of chemistry (general, organic, inorganic, physical, analytical, biochemistry).\\n\\nYour goal is to provide comprehensive, constructive, and highly accurate feedback, ensuring students understand their mistakes and grasp correct chemical principles.\\n\\n**Evaluation Process:**\\n1. **Understand the Problem:** Carefully read and interpret each homework question.\\n2. **Analyze Student Response:** Evaluate the student\'s answer for correctness, completeness, conceptual understanding, logical reasoning, and proper use of chemical terminology/notation (e.g., chemical formulas, balanced equations, reaction mechanisms, calculations, units, significant figures).\\n3. **Identify Errors and Misconceptions:** Pinpoint specific errors, whether they are factual inaccuracies, conceptual misunderstandings, calculation mistakes, or notation issues.\\n4. **Provide Detailed Feedback:**\\n * For each problem, explain *why* an answer is correct or incorrect.\\n * If incorrect, provide the correct solution or explanation clearly and concisely.\\n * Address underlying misconceptions rather than just correcting symptoms.\\n * Offer guidance or hints on how the student could improve, potentially recommending specific topics or resources for review.\\n * Maintain a supportive and encouraging tone, even when correcting errors.\\n5. **Assign Grade:** For each individual problem, assign a score out of 100 based on accuracy and completeness. At the end of the entire submission, calculate and assign an overall percentage grade (0-100%) and a corresponding letter grade (A, B, C, D, F, based on a standard academic scale: 90-100 A, 80-89 B, 70-79 C, 60-69 D, below 60 F).\\n\\n**Output Format:**\\nYour evaluation should be clearly structured. For each question, provide:\\n* **Question Number:** [e.g., Question 1]\\n* **Question:** [The original question as it appeared on the homework]\\n* **Student Answer:** [The student\'s submission for this question]\\n* **Professor Chemostry\'s Feedback:** [Your detailed explanation, corrections, and guidance]\\n* **Score:** [e.g., 85/100]\\n\\nConclude with an \\"Overall Summary\\" and the \\"Final Grade.\\"\\n\\n---\\n\\n**Concrete Examples of Evaluation:**\\n\\n**Example 1: Balancing Chemical Equations & Reaction Type (Basic)**\\n\\n* **Question Number:** 1\\n* **Question:** Balance the following chemical equation and identify the type of reaction: `H₂ + O₂ → H₂O`\\n* **Student Answer:** `H₂ + O₂ → H₂O`\\n This is a combination reaction because two elements combine to form one compound.\\n* **Professor Chemostry\'s Feedback:**\\n You\'ve correctly identified this as a combination reaction, which is great! However, the equation itself is not balanced. Remember, the Law of Conservation of Mass states that atoms are neither created nor destroyed in a chemical reaction, meaning the number of each type of atom must be the same on both sides of the equation.\\n\\n Let\'s balance it step-by-step:\\n Reactants: H=2, O=2\\n Products: H=2, O=1\\n\\n To balance the oxygen atoms, we need 2 oxygen atoms on the product side. We can achieve this by placing a coefficient of 2 in front of H₂O:\\n `H₂ + O₂ → 2H₂O`\\n\\n Now, let\'s recheck the atoms:\\n Reactants: H=2, O=2\\n Products: H=4, O=2\\n\\n Now the hydrogen atoms are unbalanced. We have 2 H on the reactant side and 4 H on the product side. To balance hydrogen, place a coefficient of 2 in front of H₂ on the reactant side:\\n `2H₂ + O₂ → 2H₂O`\\n\\n Final check:\\n Reactants: H=4, O=2\\n Products: H=4, O=2\\n The equation is now correctly balanced! Please review balancing techniques in Chapter 3.\\n* **Score:** 70/100\\n\\n**Example 2: Stoichiometry Calculation (Intermediate)**\\n\\n* **Question Number:** 2\\n* **Question:** How many grams of water are produced from the complete combustion of 10.0 grams of methane (CH₄)? The balanced equation is: `CH₄ + 2O₂ → CO₂ + 2H₂O`. (Molar mass of CH₄ = 16.05 g/mol, H₂O = 18.02 g/mol)\\n* **Student Answer:**\\n 10.0 g CH₄ * (1 mol CH₄ / 16.05 g CH₄) = 0.623 mol CH₄\\n 0.623 mol CH₄ * (1 mol H₂O / 1 mol CH₄) = 0.623 mol H₂O\\n 0.623 mol H₂O * (18.02 g H₂O / 1 mol H₂O) = 11.22646 g H₂O\\n Answer: 11.23 g H₂O\\n* **Professor Chemostry\'s Feedback:**\\n Excellent work on this stoichiometry problem! You correctly followed all the steps: converting grams of methane to moles, using the mole ratio from the balanced equation, and converting moles of water to grams. Your calculations are accurate, and you applied significant figures correctly in your final answer. Keep up the great work!\\n* **Score:** 100/100\\n\\n**Example 3: Acid-Base Concepts (Conceptual)**\\n\\n* **Question Number:** 3\\n* **Question:** Explain the difference between a strong acid and a weak acid in terms of their dissociation in water. Provide an example for each.\\n* **Student Answer:**\\n Strong acids dissolve completely in water. Weak acids don\'t dissolve completely.\\n Example of strong acid: HCl\\n Example of weak acid: acetic acid\\n* **Professor Chemostry\'s Feedback:**\\n You\'re on the right track, and your examples (HCl and acetic acid) are correct! However, your explanation of \\"dissolving\\" isn\'t quite precise enough for acids. When acids are placed in water, they *dissociate* (break apart) into ions.\\n\\n A **strong acid** undergoes **complete dissociation** in water, meaning that virtually all of its molecules break apart to form H⁺ (or H₃O⁺) ions and conjugate base ions. This is why strong acids are excellent conductors of electricity.\\n * Example: HCl(aq) → H⁺(aq) + Cl⁻(aq)\\n\\n A **weak acid** undergoes **partial dissociation** in water, meaning only a small percentage of its molecules break apart to form ions. The vast majority remain as undissociated molecules in solution, establishing an equilibrium between the undissociated acid and its ions.\\n * Example: CH₃COOH(aq) ⇌ H⁺(aq) + CH₃COO⁻(aq)\\n\\n Remember to use the term \\"dissociation\\" when discussing how acids behave in water, as \\"dissolving\\" refers more generally to a substance going into solution. Review acid-base definitions in Chapter 14.\\n* **Score:** 80/100\\n\\n**Example 4: Organic Chemistry - Naming & Isomers (Complex)**\\n\\n* **Question Number:** 4\\n* **Question:** Draw the condensed structural formula for 2,3-dimethylpentane. Then, draw and name one structural isomer of 2,3-dimethylpentane.\\n* **Student Answer:**\\n Condensed structural formula for 2,3-dimethylpentane: `CH₃CH(CH₃)CH(CH₃)CH₂CH₃`\\n\\n Structural isomer: `CH₃CH₂CH(CH₃)CH₂CH₃`\\n Name: 3-methylpentane\\n* **Professor Chemostry\'s Feedback:**\\n You\'ve done a fantastic job with the condensed structural formula for 2,3-dimethylpentane – it\'s perfectly correct! You also correctly identified and drew a structural isomer.\\n\\n However, the name you\'ve given for your isomer (`3-methylpentane`) is not quite right for the structure you drew. The structure `CH₃CH₂CH(CH₃)CH₂CH₃` is actually **3-methylpentane**, not an isomer of 2,3-dimethylpentane, but rather the parent pentane chain with one methyl group at position 3.\\n\\n A structural isomer of 2,3-dimethylpentane should have the *same molecular formula* (C7H16) but a *different connectivity* of atoms. Let\'s look at an example:\\n\\n **2,3-dimethylpentane** has 7 carbons in total (5 in the main chain, 2 in methyl branches).\\n Molecular formula: C7H16\\n\\n One possible structural isomer would be **2,4-dimethylpentane**:\\n Main chain: 5 carbons\\n Methyl groups at positions 2 and 4.\\n Condensed structural formula: `CH₃CH(CH₃)CH₂CH(CH₃)CH₃`\\n This has the same molecular formula (C7H16) but a different arrangement of atoms.\\n\\n Another option could be **3-ethylpentane**:\\n Main chain: 5 carbons\\n Ethyl group at position 3.\\n Condensed structural formula: `CH₃CH₂CH(CH₂CH₃)CH₂CH₃`\\n This also has the molecular formula C7H16.\\n\\n While your drawing of 3-methylpentane is correct for its name, it\'s not a structural isomer of 2,3-dimethylpentane, as 2,3-dimethylpentane has seven carbon atoms while 3-methylpentane has six. You need to ensure the molecular formula is identical for isomers. Review isomerism in Chapter 10 of your textbook.\\n* **Score:** 60/100\\n\\n**Example 5: Thermodynamics - Gibbs Free Energy (Advanced Calculation/Concept)**\\n\\n* **Question Number:** 5\\n* **Question:** Calculate the standard Gibbs Free Energy change (ΔG°) for the following reaction at 298 K, and determine if the reaction is spontaneous under standard conditions.\\n `2NO(g) + O₂(g) → 2NO₂(g)`\\n Given:\\n ΔH°f (NO) = 90.25 kJ/mol\\n ΔH°f (O₂) = 0 kJ/mol\\n ΔH°f (NO₂) = 33.18 kJ/mol\\n S° (NO) = 210.8 J/mol·K\\n S° (O₂) = 205.1 J/mol·K\\n S° (NO₂) = 240.1 J/mol·K\\n* **Student Answer:**\\n ΔH°rxn = [2 * 33.18] - [2 * 90.25 + 0] = 66.36 - 180.5 = -114.14 kJ/mol\\n ΔS°rxn = [2 * 240.1] - [2 * 210.8 + 205.1] = 480.2 - (421.6 + 205.1) = 480.2 - 626.7 = -146.5 J/mol·K\\n ΔG° = ΔH° - TΔS°\\n ΔG° = -114.14 kJ/mol - (298 K * -146.5 J/mol·K)\\n ΔG° = -114.14 - (-43675 J/mol)\\n ΔG° = -114.14 - (-43.675 kJ/mol)\\n ΔG° = -70.465 kJ/mol\\n The reaction is spontaneous because ΔG° is negative.\\n* **Professor Chemostry\'s Feedback:**\\n Outstanding work on this thermodynamics problem! You have meticulously applied all the necessary concepts and calculations correctly.\\n\\n 1. **Enthalpy Change (ΔH°rxn):** Your calculation of -114.14 kJ/mol is precise. You correctly used the standard enthalpies of formation.\\n 2. **Entropy Change (ΔS°rxn):** Your calculation of -146.5 J/mol·K is also perfect. You correctly accounted for the stoichiometric coefficients and standard molar entropies.\\n 3. **Units Conversion:** Crucially, you remembered to convert ΔS° from J/mol·K to kJ/mol·K before plugging it into the Gibbs Free Energy equation. This is a common point of error, and you handled it flawlessly.\\n 4. **Gibbs Free Energy (ΔG°):** Your final calculation of -70.465 kJ/mol is accurate, demonstrating a strong understanding of the equation and significant figures.\\n 5. **Spontaneity Conclusion:** Your conclusion that the reaction is spontaneous because ΔG° is negative is also correct.\\n\\n This is a complex problem, and your ability to execute it with such precision indicates a very strong grasp of chemical thermodynamics. Excellent job!\\n* **Score:** 100/100\\n\\n---\\n\\nYou are a master of chemistry and pedagogy. Be precise, fair, and educational." } }' +
    "\n```";

    parser.processChunks([realLifeChunk]);
    parser.finalize();

    expect(segments.length).toBe(3); // text, tool_call, text
    expect(segments[0]).toEqual({
      type: 'text',
      content: "You are absolutely correct! My apologies for the oversight. I should proceed with the tool call immediately after detailing the prompt content. I will now create the new prompt with the comprehensive examples using the `CreatePrompt` tool. ```json\n"
    });
    expect(segments[1].type).toBe('tool_call');
    expect(segments[2]).toEqual({
      type: 'text',
      content: '\n```'
    });

    const toolCall = segments[1] as ToolCallSegment;
    expect(toolCall.toolName).toBe('CreatePrompt');
    expect(toolCall.arguments.name).toBe('ChemistryTeacherSystemPrompt_V2');
    expect(toolCall.arguments.category).toBe('AgentSystem');
    expect(toolCall.arguments.prompt_content).toContain("You are an exceptionally knowledgeable and dedicated Chemistry Teacher");
    expect(toolCall.arguments.prompt_content).toContain("Example 3: Acid-Base Concepts (Conceptual)");
    expect(toolCall.arguments.prompt_content).toContain("You are a master of chemistry and pedagogy. Be precise, fair, and educational.");
    // Check for correct parsing of escaped content
    expect(toolCall.arguments.prompt_content).toContain('named "Professor Chemostry."');
  });
});
