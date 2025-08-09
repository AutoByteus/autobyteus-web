/* autobyteus-web/utils/aiResponseParser/stateMachine/ParserContext.ts */
import type { AIResponseSegment, AIResponseTextSegment, FileSegment, ThinkSegment, ToolCallSegment } from '../types';
import { getLanguage } from '../languageDetector';
import type { State } from './State';
import type { ToolParsingStrategy } from '../tool_parsing_strategies/base';
import type { ToolInvocation } from '~/types/tool-invocation';
import type { AgentRunState } from '~/types/agent/AgentRunState';
import type { AgentContext } from '~/types/agent/AgentContext';
import { useLLMProviderConfigStore } from '~/stores/llmProviderConfig';
import { getToolParsingStrategy } from '../strategyProvider';
import { StreamScanner } from './StreamScanner';

type CurrentSegment = FileSegment | AIResponseTextSegment | ThinkSegment | ToolCallSegment | null;

export class ParserContext {
  public segments: AIResponseSegment[];
  private scanner: StreamScanner;
  
  public currentSegment: CurrentSegment = null;

  public readonly strategy: ToolParsingStrategy;
  public readonly parseToolCalls: boolean;
  public readonly agentRunState: AgentRunState;

  private _currentState: State | null = null;

  constructor(agentContext: AgentContext) {
    const lastAiMsg = agentContext.lastAIMessage;
    if (!lastAiMsg) {
      throw new Error("ParserContext cannot be created without an active AI message.");
    }

    this.segments = lastAiMsg.segments;
    this.scanner = new StreamScanner();
    this.agentRunState = agentContext.state;
    this.parseToolCalls = agentContext.parseToolCalls;
    
    const provider = useLLMProviderConfigStore().getProviderForModel(agentContext.config.llmModelIdentifier);
    this.strategy = getToolParsingStrategy(provider!);
  }
  
  append(text: string): void {
    this.scanner.append(text);
  }

  set currentState(state: State) {
    this._currentState = state;
  }

  get currentState(): State {
    if (!this._currentState) {
      throw new Error('No current state is set.');
    }
    return this._currentState;
  }

  transitionTo(newState: State): void {
    this._currentState = newState;
  }

  appendTextSegment(text: string): void {
    if (text.length === 0) return;

    const lastSegment = this.segments[this.segments.length - 1];
    if (lastSegment && lastSegment.type === 'text') {
      lastSegment.content += text;
    } else {
      const newTextSegment: AIResponseTextSegment = { type: 'text', content: text };
      this.segments.push(newTextSegment);
    }
    this.currentSegment = null;
  }

  appendToFileSegment(char: string): void {
    if (this.currentSegment && this.currentSegment.type === 'file') {
      this.currentSegment.originalContent += char;
    }
  }

  startFileSegment(path: string): void {
    const newFileSegment: FileSegment = { type: 'file', path, originalContent: '', language: getLanguage(path) };
    this.segments.push(newFileSegment);
    this.currentSegment = newFileSegment;
  }

  endFileSegment(): void {
    this.currentSegment = null;
  }
  
  appendToCurrentToolRawJson(char: string): void {
    if (this.currentSegment && this.currentSegment.type === 'tool_call' && this.currentSegment.status === 'parsing') {
        if(this.currentSegment.rawJsonContent === undefined) {
            this.currentSegment.rawJsonContent = '';
        }
        this.currentSegment.rawJsonContent += char;
    }
  }
  
  appendToCurrentToolArgument(argName: string, value: string): void {
    if (this.currentSegment && this.currentSegment.type === 'tool_call') {
      if (!this.currentSegment.arguments[argName]) {
        this.currentSegment.arguments[argName] = '';
      }
      this.currentSegment.arguments[argName] += value;
    }
  }

  startXmlToolCallSegment(toolName: string): void {
      // Generate ID immediately with empty args, will be updated later.
      const invocationId = this.agentRunState.generateUniqueInvocationId(toolName, {});
      const toolCallSegment: ToolCallSegment = {
          type: 'tool_call',
          invocationId,
          toolName,
          arguments: {},
          status: 'parsing',
          logs: [],
          result: null,
          error: null,
      };
      this.segments.push(toolCallSegment);
      this.currentSegment = toolCallSegment;
  }
  
  startJsonToolCallSegment(): void {
      const toolCallSegment: ToolCallSegment = {
          type: 'tool_call',
          invocationId: 'temp-json-id', // Placeholder, will be replaced in finalize
          toolName: '',
          arguments: {},
          status: 'parsing',
          logs: [],
          result: null,
          error: null,
          rawJsonContent: '',
      };
      this.segments.push(toolCallSegment);
      this.currentSegment = toolCallSegment;
  }

  updateCurrentToolArguments(args: Record<string, any>): void {
      if (this.currentSegment && this.currentSegment.type === 'tool_call') {
          this.currentSegment.arguments = args;
      }
  }

  endCurrentToolSegment(): void {
      if (this.currentSegment && this.currentSegment.type === 'tool_call') {
          this.currentSegment.invocationId = this.agentRunState.generateUniqueInvocationId(this.currentSegment.toolName, this.currentSegment.arguments);
          this.currentSegment.status = 'parsed';
      }
      this.currentSegment = null;
  }

  finalizeJsonSegment(invocations: ToolInvocation[]): void {
      const parsingSegmentIndex = this.segments.findIndex(
        s => s.type === 'tool_call' && s.status === 'parsing'
      );

      if (parsingSegmentIndex === -1) {
          console.warn("Could not find parsing segment to finalize.");
          return;
      }

      const parsingSegment = this.segments[parsingSegmentIndex] as ToolCallSegment;
      this.segments.splice(parsingSegmentIndex, 1);

      if (invocations.length > 0) {
          for (let i = 0; i < invocations.length; i++) {
              const invocation = invocations[i];
              const toolCallSegment: ToolCallSegment = {
                  type: 'tool_call',
                  invocationId: this.agentRunState.generateUniqueInvocationId(invocation.name, invocation.arguments),
                  toolName: invocation.name,
                  arguments: invocation.arguments,
                  status: 'parsed',
                  logs: [],
                  result: null,
                  error: null,
                  rawJsonContent: parsingSegment.rawJsonContent,
              };
              this.segments.splice(parsingSegmentIndex + i, 0, toolCallSegment);
          }
      } else {
          const rawContent = parsingSegment.rawJsonContent || '';
          if (rawContent) {
              console.warn("Could not parse JSON tool call from stream. Reverting to text.", rawContent);
              
              const prevSegment = parsingSegmentIndex > 0 ? this.segments[parsingSegmentIndex - 1] : null;
              if (prevSegment && prevSegment.type === 'text') {
                  prevSegment.content += rawContent;
              } else {
                  const newTextSegment: AIResponseTextSegment = { type: 'text', content: rawContent };
                  this.segments.splice(parsingSegmentIndex, 0, newTextSegment);
              }
          }
      }
      
      this.currentSegment = null;
  }

  // --- Stream Navigation Methods (delegating to StreamScanner) ---

  advance(): void {
    this.scanner.advance();
  }

  advanceBy(count: number): void {
    this.scanner.advanceBy(count);
  }

  hasMoreChars(): boolean {
    return this.scanner.hasMoreChars();
  }

  peekChar(): string | undefined {
    return this.scanner.peek();
  }

  getPosition(): number {
    return this.scanner.getPosition();
  }

  setPosition(position: number): void {
    this.scanner.setPosition(position);
  }

  substring(start: number, end?: number): string {
    return this.scanner.substring(start, end);
  }
}
