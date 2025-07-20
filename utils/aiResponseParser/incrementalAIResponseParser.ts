import type { AIResponseSegment } from './types';
import { StateMachine } from './stateMachine/StateMachine';
import type { ParserContext } from './stateMachine/ParserContext';

export class IncrementalAIResponseParser {
  private stateMachine: StateMachine;
  private context: ParserContext;

  constructor(parserContext: ParserContext) {
    this.context = parserContext;
    this.stateMachine = new StateMachine(this.context);
  }

  processChunks(chunks: string[]): AIResponseSegment[] {
    this.stateMachine.appendChunks(chunks);
    this.stateMachine.run();
    return this.stateMachine.getSegments();
  }

  /**
   * Finalizes the parsing process. This should be called after the last chunk has been processed
   * to ensure any buffered data or incomplete segments are correctly handled.
   */
  finalize(): void {
    this.stateMachine.finalize();
  }
}
