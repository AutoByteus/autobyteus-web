/* autobyteus-web/utils/aiResponseParser/stateMachine/ParserContext.ts */
import type { AIResponseSegment, AIResponseTextSegment, FileSegment, ThinkSegment, ToolCallSegment } from '../types';
import { getLanguage } from '../languageDetector';
import type { State } from './State';
import { generateInvocationId } from '~/utils/toolUtils';
import type { ToolParsingStrategy } from '../streaming_strategies/base';
import type { ToolInvocation } from '~/types/tool-invocation';

type CurrentSegment = FileSegment | AIResponseTextSegment | ThinkSegment | ToolCallSegment | null;

export class ParserContext {
  public segments: AIResponseSegment[];
  public buffer: string = '';
  public pos: number = 0;
  
  public tagBuffer: string = '';
  public fileClosingBuffer: string = '';
  public currentSegment: CurrentSegment = null;
  
  public readonly strategy: ToolParsingStrategy;
  public readonly useXml: boolean;

  private _currentState: State | null = null;

  constructor(segments: AIResponseSegment[], strategy: ToolParsingStrategy, useXml: boolean) {
    this.segments = segments;
    this.strategy = strategy;
    this.useXml = useXml;
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

  appendToCurrentToolArgument(argName: string, char: string): void {
    if (this.currentSegment && this.currentSegment.type === 'tool_call') {
      if (!this.currentSegment.arguments[argName]) {
        this.currentSegment.arguments[argName] = '';
      }
      this.currentSegment.arguments[argName] += char;
    }
  }
  
  appendToCurrentToolRawJson(char: string): void {
    if (this.currentSegment && this.currentSegment.type === 'tool_call' && this.currentSegment.status === 'parsing') {
        if(this.currentSegment.rawJsonContent === undefined) {
            this.currentSegment.rawJsonContent = '';
        }
        this.currentSegment.rawJsonContent += char;
    }
  }

  startToolCallSegment(toolName: string): void {
      const invocationId = generateInvocationId(toolName, {}); // Initially empty args
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
          invocationId: 'temp-json-id',
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
          this.currentSegment.invocationId = generateInvocationId(this.currentSegment.toolName, this.currentSegment.arguments);
          this.currentSegment.status = 'parsed';
      }
      this.currentSegment = null;
  }

  finalizeJsonSegment(invocations: ToolInvocation[]): void {
      const parsingSegment = this.segments.find(
        s => s.type === 'tool_call' && s.status === 'parsing'
      ) as ToolCallSegment | undefined;

      if (!parsingSegment) {
          console.warn("Could not find parsing segment to finalize.");
          return;
      }
      
      if (invocations.length > 0) {
          const firstInvocation = invocations[0];
          parsingSegment.toolName = firstInvocation.name;
          parsingSegment.arguments = firstInvocation.arguments;
          parsingSegment.invocationId = generateInvocationId(firstInvocation.name, firstInvocation.arguments);
          parsingSegment.status = 'parsed';

          for (let i = 1; i < invocations.length; i++) {
              const subsequentInvocation = invocations[i];
              const toolCallSegment: ToolCallSegment = {
                  type: 'tool_call',
                  invocationId: generateInvocationId(subsequentInvocation.name, subsequentInvocation.arguments),
                  toolName: subsequentInvocation.name,
                  arguments: subsequentInvocation.arguments,
                  status: 'parsed',
                  logs: [],
                  result: null,
                  error: null,
              };
              this.segments.push(toolCallSegment);
          }
      } else {
          const parsingSegmentIndex = this.segments.indexOf(parsingSegment);
          if (parsingSegmentIndex > -1) {
              this.segments.splice(parsingSegmentIndex, 1);
          }
          console.warn("Could not parse JSON tool call from stream.", parsingSegment.rawJsonContent);
      }
      
      this.currentSegment = null;
  }

  advance(): void {
    this.pos++;
  }

  advanceBy(count: number): void {
    this.pos += count;
  }

  hasMoreChars(): boolean {
    return this.pos < this.buffer.length;
  }

  peekChar(): string | undefined {
    return this.buffer[this.pos];
  }
}
