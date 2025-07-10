import type { AIResponseSegment } from './types';
import { StateMachine } from './stateMachine/StateMachine';
import { LLMProvider } from '~/types/llm';
import { getStreamingStrategy } from './strategyProvider';

export class IncrementalAIResponseParser {
  private stateMachine: StateMachine;

  constructor(segments: AIResponseSegment[], provider: LLMProvider, useXml: boolean) {
    const strategy = getStreamingStrategy(provider, useXml);
    this.stateMachine = new StateMachine(segments, strategy, useXml);
  }

  processChunks(chunks: string[]): AIResponseSegment[] {
    this.stateMachine.appendChunks(chunks);
    this.stateMachine.run();
    return this.stateMachine.getSegments();
  }
}
