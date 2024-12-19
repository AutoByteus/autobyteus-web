import type { AIResponseSegment } from './types';
import { StateMachine } from './stateMachine/StateMachine';

export class IncrementalAIResponseParser {
  private stateMachine: StateMachine;

  constructor(segments: AIResponseSegment[]) {
    this.stateMachine = new StateMachine(segments);
  }

  processChunks(chunks: string[]): AIResponseSegment[] {
    this.stateMachine.appendChunks(chunks);
    this.stateMachine.run();
    return this.stateMachine.getSegments();
  }
}