import type { AIResponseSegment, AIResponseTextSegment, FileSegment, BashCommandSegment } from '../types';
import { getLanguage } from '../languageDetector';
import { State } from './State';

type CurrentSegment = FileSegment | AIResponseTextSegment | null;

export class ParserContext {
  public segments: AIResponseSegment[];
  public buffer: string = '';
  public pos: number = 0;

  public tagBuffer: string = '';
  public fileClosingBuffer: string = '';
  public currentSegment: CurrentSegment = null;

  private _currentState: State | null = null;

  constructor(segments: AIResponseSegment[]) {
    this.segments = segments;
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

  /**
   * Append text to a text segment. If currentSegment is not text, create a new one.
   */
  appendTextSegment(text: string): void {
    if (text.length === 0) return;

    if (!this.currentSegment || this.currentSegment.type !== 'text') {
      const newTextSegment: AIResponseTextSegment = {
        type: 'text',
        content: ''
      };
      this.segments.push(newTextSegment);
      this.currentSegment = newTextSegment;
    }

    (this.currentSegment as AIResponseTextSegment).content += text;
  }

  /**
   * Append a character to the current file segment.
   * This assumes we are currently parsing a file segment. If not, no action taken.
   */
  appendToFileSegment(char: string): void {
    if (this.currentSegment && this.currentSegment.type === 'file') {
      this.currentSegment.originalContent += char;
    }
  }

  parseBashTag(tag: string): void {
    const commandMatch = tag.match(/command=['"]([^'"]+)['"]/);
    const descriptionMatch = tag.match(/description=['"]([^'"]+)['"]/);
    if (commandMatch) {
      const command = commandMatch[1];
      const description = descriptionMatch ? descriptionMatch[1] : '';
      const bashCommandSegment: BashCommandSegment = {
        type: 'bash_command',
        command,
        description
      };
      this.segments.push(bashCommandSegment);
      // After a bash command, reset currentSegment to null
      this.currentSegment = null;
    }
  }

  startFileSegment(path: string): void {
    const newFileSegment: FileSegment = {
      type: 'file',
      path,
      originalContent: '',
      language: getLanguage(path)
    };
    this.segments.push(newFileSegment);
    this.currentSegment = newFileSegment;
  }

  endFileSegment(): void {
    this.currentSegment = null;
  }

  advance(): void {
    this.pos++;
  }

  hasMoreChars(): boolean {
    return this.pos < this.buffer.length;
  }

  peekChar(): string | undefined {
    return this.buffer[this.pos];
  }
}