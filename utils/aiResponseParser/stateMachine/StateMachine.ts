import { ParserContext } from './ParserContext';
import { TextState } from './TextState';

export class StateMachine {
  private parserContext: ParserContext;

  constructor(segments: any[]) {
    // Initialize parserContext and the initial state
    this.parserContext = new ParserContext(segments);
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