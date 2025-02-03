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

  it('should handle unknown tags as text across multiple chunks', () => {
    parser.processChunks(['<think>']);
    expect(segments).toEqual([
      { type: 'text', content: '<think>' }
    ]);

    parser.processChunks(['random text</think>']);
    expect(segments).toEqual([
      { type: 'text', content: '<think>random text</think>' }
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
        type: 'bash_command',
        command: 'git status',
        description: 'Check git status'
      },
      {
        type: 'file',
        path: 'README.md',
        originalContent: '# Project Title\n    Some ',
        language: 'markdown'
      }
    ]);

    parser.processChunks(['description here.', '</file>']);
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
        originalContent: `# Project Title\n    Some description here.`,
        language: 'markdown'
      }
    ]);

    parser.processChunks(['Final text.']);
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
    // Test opening tag character by character
    parser.processChunks(['<']);
    parser.processChunks(['f']);
    parser.processChunks(['i']);
    parser.processChunks(['l']);
    parser.processChunks(['e']);
    parser.processChunks([' ']);
    parser.processChunks(['p']);
    parser.processChunks(['a']);
    parser.processChunks(['t']);
    parser.processChunks(['h']);
    parser.processChunks(['=']);
    parser.processChunks(['"']);
    parser.processChunks(['f']);
    parser.processChunks(['i']);
    parser.processChunks(['b']);
    parser.processChunks(['o']);
    parser.processChunks(['n']);
    parser.processChunks(['a']);
    parser.processChunks(['c']);
    parser.processChunks(['c']);
    parser.processChunks(['i']);
    parser.processChunks(['.']);
    parser.processChunks(['p']);
    parser.processChunks(['y']);
    parser.processChunks(['"']);
    parser.processChunks(['>']);
    // Verify file segment started
    expect(segments).toHaveLength(1);
    expect(segments[0]).toMatchObject({
      type: 'file',
      path: 'fibonacci.py',
      language: 'python',
      originalContent: ''
    });

    const fileContent = [
      'def fibonacci(n):\n',
      '    """',
      '\n    Generate Fibonacci series up to n terms.',
      '\n    \n    Args:',
      '\n    n (int): Number of terms to generate',
      '\n    \n    Returns:',
      '\n    list: List containing the Fibonacci series',
      '\n    """',
      '\n    if n <= 0:',
      '\n        return []',
      '\n    elif n == 1:',
      '\n        return [0]',
      '\n    elif n == 2:',
      '\n        return [0, 1]',
      '\n    \n    fib = [0, 1]',
      '\n    for i in range(2, n):',
      '\n        fib.append(fib[i-1] + fib[i-2])',
      '\n    return fib\n',
      '\ndef main():',
      '\n    while True:',
      '\n        try:',
      '\n            n = int(input("Enter the number of Fibonacci terms to generate (or 0 to exit): "))',
      '\n            if n == 0:',
      '\n                print("Exiting the program.")',
      '\n                break',
      '\n            if n < 0:',
      '\n                print("Please enter a non-negative integer.")',
      '\n                continue',
      '\n            \n            fib_series = fibonacci(n)',
      '\n            print(f"Fibonacci series with {n} terms:")',
      '\n            print(", ".join(map(str, fib_series)))',
      '\n        except ValueError:',
      '\n            print("Invalid input. Please enter a valid integer.")\n',
      '\nif __name__ == "__main__":',
      '\n    main()'
    ];

    // Process the file content in chunks
    fileContent.forEach(chunk => parser.processChunks([chunk]));

    // Process closing tag character by character
    parser.processChunks(['<']);
    parser.processChunks(['/']);
    parser.processChunks(['f']);
    parser.processChunks(['i']);
    parser.processChunks(['l']);
    parser.processChunks(['e']);
    parser.processChunks(['>']);

    expect(segments).toHaveLength(1);
    const expectedContent = fileContent.join('');
    expect(segments[0]).toMatchObject({
      type: 'file',
      path: 'fibonacci.py',
      language: 'python',
      originalContent: expectedContent
    });
  });
});