import type { AIResponseSegment } from './types';
import { StateMachine } from './stateMachine/StateMachine';
import { LLMProvider } from '~/types/llm';
import { getToolParsingStrategy } from './strategyProvider';

export class IncrementalAIResponseParser {
  private stateMachine: StateMachine;

  constructor(segments: AIResponseSegment[], provider: LLMProvider, useXml: boolean, parseToolCalls: boolean) {
    const strategy = getToolParsingStrategy(provider, useXml);
    this.stateMachine = new StateMachine(segments, strategy, useXml, parseToolCalls);
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