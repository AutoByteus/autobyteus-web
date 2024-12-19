import { describe, it, expect } from 'vitest';
import { StateMachine } from '../StateMachine';
import type { AIResponseSegment } from '../../types';

describe('StateMachine', () => {
  it('should parse a mix of text, bash command, and file segments', () => {
    const segments: AIResponseSegment[] = [];
    const machine = new StateMachine(segments);

    machine.appendChunks(['Intro text ', '<bash command="echo Hello" description="Print hello"/>', ' Middle text ', '<file path="src/test.js">console.log("Hi")</file>', ' Ending text']);
    machine.run();

    expect(segments).toEqual([
      { type: 'text', content: 'Intro text ' },
      { type: 'bash_command', command: 'echo Hello', description: 'Print hello' },
      { type: 'text', content: ' Middle text ' },
      {
        type: 'file',
        path: 'src/test.js',
        originalContent: 'console.log("Hi")',
        language: 'javascript'
      },
      { type: 'text', content: ' Ending text' }
    ]);
  });

  it('should handle incremental parsing', () => {
    const segments: AIResponseSegment[] = [];
    const machine = new StateMachine(segments);

    machine.appendChunks(['Hello']);
    machine.run();
    expect(segments).toEqual([{ type: 'text', content: 'Hello' }]);

    machine.appendChunks([' <bash command="ls" description="List files"/> More text']);
    machine.run();
    expect(segments).toEqual([
      { type: 'text', content: 'Hello ' },
      { type: 'bash_command', command: 'ls', description: 'List files' },
      { type: 'text', content: ' More text' }
    ]);
  });

  it('should handle an unknown tag as text', () => {
    const segments: AIResponseSegment[] = [];
    const machine = new StateMachine(segments);

    machine.appendChunks(['Some <unknown>tag</unknown> text']);
    machine.run();
    expect(segments).toEqual([
      { type: 'text', content: 'Some <unknown>tag</unknown> text' }
    ]);
  });
});