import { ParserContext } from './ParserContext';
import { TextState } from './TextState';
import type { ToolParsingStrategy } from '../streaming_strategies/base';

export class StateMachine {
  private parserContext: ParserContext;

  constructor(segments: any[], strategy: ToolParsingStrategy, useXml: boolean) {
    this.parserContext = new ParserContext(segments, strategy, useXml);
    this.parserContext.currentState = new TextState(this.parserContext);
  }

  run(): void {
    while (this.parserContext.hasMoreChars()) {
      this.parserContext.currentState.run();
    }
  }

  appendChunks(chunks: string[]): void {
    this.parserContext.buffer += chunks.join('');
  }

  getSegments() {
    return this.parserContext.segments;
  }
}
