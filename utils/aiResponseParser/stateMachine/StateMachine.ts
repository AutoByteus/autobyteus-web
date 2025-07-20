import { ParserContext } from './ParserContext';
import { TextState } from './TextState';
import type { ToolParsingStrategy } from '../tool_parsing_strategies/base';

export class StateMachine {
  private parserContext: ParserContext;

  constructor(parserContext: ParserContext) {
    this.parserContext = parserContext;
    this.parserContext.currentState = new TextState(this.parserContext);
  }

  run(): void {
    while (this.parserContext.hasMoreChars()) {
      this.parserContext.currentState.run();
    }
  }

  finalize(): void {
    this.parserContext.currentState.finalize();
  }

  appendChunks(chunks: string[]): void {
    this.parserContext.buffer += chunks.join('');
  }

  getSegments() {
    return this.parserContext.segments;
  }
}
