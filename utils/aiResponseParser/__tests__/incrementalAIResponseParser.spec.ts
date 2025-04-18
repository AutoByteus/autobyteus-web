import { IncrementalAIResponseParser } from '../incrementalAIResponseParser';
import type { AIResponseSegment } from '../types';
import { describe, it, expect, beforeEach } from 'vitest';

describe('IncrementalAIResponseParser (Integration)', () => {
  let parser: IncrementalAIResponseParser;
  let segments: AIResponseSegment[];

  beforeEach(() => {
    segments = [];
    parser = new IncrementalAIResponseParser(segments);
  });

  it('should accumulate text segments across multiple processChunks calls', () => {
    const processedSegments = parser.processChunks(['Hello']);
    expect(segments).toEqual([
      { type: 'text', content: 'Hello' }
    ]);
    expect(processedSegments).toBe(segments);

    parser.processChunks([' ', 'World']);
    expect(segments).toEqual([
      { type: 'text', content: 'Hello World' }
    ]);
  });

  it('should parse a complete bash_command segment received in multiple chunks', () => {
    parser.processChunks(['<bash command="mk']);
    expect(segments).toEqual([]);

    parser.processChunks(['dir new_folder" description="Create a new directory"/>']);
    expect(segments).toEqual([
      {
        type: 'bash_command',
        command: 'mkdir new_folder',
        description: 'Create a new directory'
      }
    ]);
  });

  it('should parse a complete file segment received in multiple chunks', () => {
    parser.processChunks(['<file path="src/components/App.vue">']);
    expect(segments).toEqual([
      {
        type: 'file',
        path: 'src/components/App.vue',
        originalContent: '',
        language: 'vue'
      }
    ]);

    parser.processChunks(['<template>\n  <div>Hello ']);
    expect(segments).toEqual([
      {
        type: 'file',
        path: 'src/components/App.vue',
        originalContent: '<template>\n  <div>Hello ',
        language: 'vue'
      }
    ]);

    parser.processChunks(['World</div>\n</template>', '</file>']);
    expect(segments).toEqual([
      {
        type: 'file',
        path: 'src/components/App.vue',
        originalContent: `<template>\n  <div>Hello World</div>\n</template>`,
        language: 'vue'
      }
    ]);
  });

  it('should handle mixed segments received in multiple chunks', () => {
    parser.processChunks(['Start of text ']);
    expect(segments).toEqual([
      { type: 'text', content: 'Start of text ' }
    ]);

    parser.processChunks(['<bash command="echo ']);
    expect(segments).toEqual([
      { type: 'text', content: 'Start of text ' }
    ]);

    parser.processChunks(['Hello" description="Echo command" />']);
    expect(segments).toEqual([
      { type: 'text', content: 'Start of text ' },
      {
        type: 'bash_command',
        command: 'echo Hello',
        description: 'Echo command'
      }
    ]);

    parser.processChunks(['<file path="src/index.js">']);
    expect(segments).toEqual([
      { type: 'text', content: 'Start of text ' },
      {
        type: 'bash_command',
        command: 'echo Hello',
        description: 'Echo command'
      },
      {
        type: 'file',
        path: 'src/index.js',
        originalContent: '',
        language: 'javascript'
      }
    ]);

    parser.processChunks(['console.log("Hello ']);
    expect(segments).toEqual([
      { type: 'text', content: 'Start of text ' },
      {
        type: 'bash_command',
        command: 'echo Hello',
        description: 'Echo command'
      },
      {
        type: 'file',
        path: 'src/index.js',
        originalContent: 'console.log("Hello ',
        language: 'javascript'
      }
    ]);

    parser.processChunks(['World");', '</file>']);
    expect(segments).toEqual([
      { type: 'text', content: 'Start of text ' },
      {
        type: 'bash_command',
        command: 'echo Hello',
        description: 'Echo command'
      },
      {
        type: 'file',
        path: 'src/index.js',
        originalContent: `console.log("Hello World");`,
        language: 'javascript'
      }
    ]);

    parser.processChunks([' End of text.']);
    expect(segments).toEqual([
      { type: 'text', content: 'Start of text ' },
      {
        type: 'bash_command',
        command: 'echo Hello',
        description: 'Echo command'
      },
      {
        type: 'file',
        path: 'src/index.js',
        originalContent: `console.log("Hello World");`,
        language: 'javascript'
      },
      { type: 'text', content: ' End of text.' }
    ]);
  });

  it('should handle unknown tags as text across multiple chunks for unrecognized tags', () => {
    parser.processChunks(['<unknown>']);
    expect(segments).toEqual([
      { type: 'text', content: '<unknown>' }
    ]);

    parser.processChunks(['some text</unknown>']);
    expect(segments).toEqual([
      { type: 'text', content: '<unknown>some text</unknown>' }
    ]);
  });

  it('should include whitespace-only text segments across multiple chunks', () => {
    parser.processChunks(['   ']);
    expect(segments).toEqual([
      { type: 'text', content: '   ' }
    ]);

    parser.processChunks(['\n']);
    expect(segments).toEqual([
      { type: 'text', content: '   \n' }
    ]);

    parser.processChunks(['\t']);
    expect(segments).toEqual([
      { type: 'text', content: '   \n\t' }
    ]);
  });

  it('should handle multiple different segments received incrementally', () => {
    parser.processChunks(['Intro ']);
    expect(segments).toEqual([
      { type: 'text', content: 'Intro ' }
    ]);

    parser.processChunks(['<bash command="git ']);
    expect(segments).toEqual([
      { type: 'text', content: 'Intro ' }
    ]);

    parser.processChunks(['status" description="Check git status" />']);
    expect(segments).toEqual([
      { type: 'text', content: 'Intro ' },
      {
        type: 'bash_command',
        command: 'git status',
        description: 'Check git status'
      }
    ]);

    parser.processChunks(['<file path="README.md">']);
    expect(segments).toEqual([
      { type: 'text', content: 'Intro ' },
      {
        type: 'bash_command',
        command: 'git status',
        description: 'Check git status'
      },
      {
        type: 'file',
        path: 'README.md',
        originalContent: '',
        language: 'markdown'
      }
    ]);

    parser.processChunks(['# Project Title\n    Some ']);
    expect(segments).toEqual([
      { type: 'text', content: 'Intro ' },
      {
        type: 'bash_command', command: 'git status', description: 'Check git status'
      },
      {
        type: 'file', path: 'README.md', originalContent: '# Project Title\n    Some ', language: 'markdown'
      }
    ]);

    parser.processChunks(['description here.', '</file>']);
    expect(segments).toEqual([
      { type: 'text', content: 'Intro ' },
      {
        type: 'bash_command', command: 'git status', description: 'Check git status'
      },
      {
        type: 'file',
        path: 'README.md',
        originalContent: `# Project Title\n    Some description here.`,
        language: 'markdown'
      }
    ]);

    parser.processChunks(['Final text.']);
    expect(segments).toEqual([
      { type: 'text', content: 'Intro ' },
      {
        type: 'bash_command', command: 'git status', description: 'Check git status'
      },
      {
        type: 'file',
        path: 'README.md',
        originalContent: `# Project Title\n    Some description here.`,
        language: 'markdown'
      },
      { type: 'text', content: 'Final text.' }
    ]);
  });

  it('should handle empty chunks without errors', () => {
    parser.processChunks([]);
    expect(segments).toEqual([]);

    parser.processChunks(['']);
    expect(segments).toEqual([]);

    parser.processChunks(['   ']);
    expect(segments).toEqual([
      { type: 'text', content: '   ' }
    ]);
  });

  it('should verify segments array is being modified directly', () => {
    const segments: AIResponseSegment[] = [];
    const parser = new IncrementalAIResponseParser(segments);
    
    parser.processChunks(['Hello']);
    expect(segments).toHaveLength(1);
    expect(segments[0]).toEqual({ type: 'text', content: 'Hello' });
    
    const returnedSegments = parser.processChunks([' World']);
    expect(returnedSegments).toBe(segments);
    expect(segments[0]).toEqual({ type: 'text', content: 'Hello World' });
  });

  it('should handle extremely granular chunks for file parsing', () => {
    parser.processChunks(['<']);
    // … (rest of the granular-chunk test) …
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // New tests for stray <file> tags:
  // ─────────────────────────────────────────────────────────────────────────────

  it('should treat a standalone <file> tag with no path attribute as plain text', () => {
    const input = 'Here is a tag: <file> and more text';
    parser.processChunks([input]);
    expect(segments).toEqual([
      { type: 'text', content: input }
    ]);
  });

  it('should parse a real file segment that appears after a standalone <file> tag', () => {
    const chunks = [
      'Pre ',
      '<file>',
      ' middle ',
      '<file path="test.txt">',
      'content',
      '</file>',
      ' post'
    ];
    parser.processChunks(chunks);
    expect(segments).toEqual([
      { type: 'text', content: 'Pre <file> middle ' },
      { type: 'file', path: 'test.txt', originalContent: 'content', language: 'plaintext' },
      { type: 'text', content: ' post' }
    ]);
  });
});