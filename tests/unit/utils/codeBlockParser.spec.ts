import { test, expect, vi, beforeEach } from 'vitest';
import {
  extractContentBetweenTags,
  parseFileEntry,
  extractCodeBlocksFromTags,
  extractXMLString,
  extractCodeBlocksFromXML,
  getLanguage,
  parseAIResponse,
} from '~/utils/codeBlockParser/codeBlockHighlight';
import Prism from 'prismjs';
import { highlightVueCode } from '~/utils/codeBlockParser/vueCodeHighlight';

// Mock dependencies
vi.mock('prismjs', () => ({
  highlight: vi.fn((code: string, grammar: any, language: string) => `highlighted-${language}-${code}`),
  languages: {
    plaintext: {},
    python: {},
    typescript: {},
    javascript: {},
    vue: {},
    markup: {},
    php: {},
  },
}));

vi.mock('~/utils/codeHighlight', () => ({
  highlightVueCode: vi.fn((code: string) => `highlighted-vue-${code}`),
}));

test('extractContentBetweenTags should extract content between $FinalCodesStart$ and $FinalCodesEnd$', () => {
  const text = 'Some text $FinalCodesStart$Desired Content$FinalCodesEnd$ some other text';
  const extracted = extractContentBetweenTags(text);
  expect(extracted).toBe('Desired Content');
});

test('extractContentBetweenTags should throw an error if start tag is missing', () => {
  const text = 'Some text without start tag $FinalCodesEnd$';
  expect(() => extractContentBetweenTags(text)).toThrow('Code block content not found or incomplete');
});

test('extractContentBetweenTags should throw an error if end tag is missing', () => {
  const text = 'Some text with start tag $FinalCodesStart$ but no end tag';
  expect(() => extractContentBetweenTags(text)).toThrow('Code block content not found or incomplete');
});

test('parseFileEntry should parse a valid file entry with specified language', () => {
  const entry = `File: /path/to/file.py
\`\`\`python
print("Hello, World!")
\`\`\``;
  const parsed = parseFileEntry(entry);
  expect(parsed).toEqual({
    path: '/path/to/file.py',
    content: 'print("Hello, World!")',
    language: 'python',
  });
});

test('parseFileEntry should parse a valid file entry without specified language', () => {
  const entry = `File: /path/to/file.unknown
\`\`\`
Some unknown content
\`\`\``;
  const parsed = parseFileEntry(entry);
  expect(parsed).toEqual({
    path: '/path/to/file.unknown',
    content: 'Some unknown content',
    language: 'plaintext',
  });
});

test('parseFileEntry should throw an error for invalid file entry format', () => {
  const entry = `Invalid Entry Content`;
  expect(() => parseFileEntry(entry)).toThrow('Invalid file entry format');
});

test('parseFileEntry should determine language based on file extension', () => {
  const entry = `File: /path/to/file.ts
\`\`\`typescript
const x: number = 5;
\`\`\``;
  const parsed = parseFileEntry(entry);
  expect(parsed.language).toBe('typescript');
});

test('parseFileEntry should return plaintext for unknown extensions', () => {
  const entry = `File: /path/to/file.unknown
\`\`\`
Some content
\`\`\``;
  const parsed = parseFileEntry(entry);
  expect(parsed.language).toBe('plaintext');
});

test('getLanguage should return correct language for known extensions', () => {
  expect(getLanguage('/path/to/file.py')).toBe('python');
  expect(getLanguage('/path/to/file.ts')).toBe('typescript');
  expect(getLanguage('/path/to/file.js')).toBe('javascript');
  expect(getLanguage('/path/to/file.vue')).toBe('vue');
  expect(getLanguage('/path/to/file.html')).toBe('markup');
  expect(getLanguage('/path/to/file.php')).toBe('php');
});

test('getLanguage should return plaintext for unknown extensions', () => {
  expect(getLanguage('/path/to/file.unknown')).toBe('plaintext');
  expect(getLanguage('/path/to/file')).toBe('plaintext');
});

test('getLanguage should handle uppercase extensions', () => {
  expect(getLanguage('/path/to/file.PY')).toBe('python');
  expect(getLanguage('/path/to/file.JS')).toBe('javascript');
});

test('extractCodeBlocksFromTags should extract multiple code blocks from tagged content', () => {
  const content = `
Some introductory text.
$FinalCodesStart$
File: /path/to/file1.js
\`\`\`javascript
console.log("File 1");
\`\`\`
File: /path/to/file2.py
\`\`\`python
print("File 2")
\`\`\`
$FinalCodesEnd$
Some concluding text.
  `;
  const codeBlocks = extractCodeBlocksFromTags(content);
  expect(codeBlocks).toHaveLength(2);
  expect(codeBlocks[0]).toEqual({
    path: '/path/to/file1.js',
    content: 'console.log("File 1");',
    language: 'javascript',
  });
  expect(codeBlocks[1]).toEqual({
    path: '/path/to/file2.py',
    content: 'print("File 2")',
    language: 'python',
  });
});

test('extractCodeBlocksFromTags should return empty array if tags are missing', () => {
  const content = 'Content without tags.';
  const codeBlocks = extractCodeBlocksFromTags(content);
  expect(codeBlocks).toHaveLength(0);
});

test('extractCodeBlocksFromTags should handle entries with unknown extensions', () => {
  const content = `
$FinalCodesStart$
File: /path/to/file.unknown
\`\`\`
Some unknown content
\`\`\`
$FinalCodesEnd$
  `;
  const codeBlocks = extractCodeBlocksFromTags(content);
  expect(codeBlocks).toHaveLength(1);
  expect(codeBlocks[0].language).toBe('plaintext');
});

test('extractXMLString should extract XML content between <final_codes> tags', () => {
  const text = 'Some text <final_codes><file path="/path/to/file.js"><content>console.log("JS");</content></file></final_codes> more text';
  const xml = extractXMLString(text);
  expect(xml).toBe('<final_codes><file path="/path/to/file.js"><content>console.log("JS");</content></file></final_codes>');
});

test('extractXMLString should throw an error if XML tags are missing', () => {
  const text = 'Some text without XML tags.';
  expect(() => extractXMLString(text)).toThrow('XML content not found or incomplete');
});

test('extractCodeBlocksFromXML should extract code blocks from valid XML', () => {
  // Mock DOMParser
  (global as any).DOMParser = class {
    parseFromString(input: string, type: string) {
      const { DOMParser: NodeDOMParser } = require('xmldom');
      return new NodeDOMParser().parseFromString(input, type);
    }
  };

  const xmlContent = `
<final_codes>
  <file path="/path/to/file1.ts">
    <content>
      <![CDATA[
      const a: number = 10;
      ]]>
    </content>
  </file>
  <file path="/path/to/file2.vue">
    <content>
      <template>
        <div>Hello</div>
      </template>
    </content>
  </file>
</final_codes>
  `;
  const codeBlocks = extractCodeBlocksFromXML(xmlContent);
  expect(codeBlocks).toHaveLength(2);
  expect(codeBlocks[0]).toEqual({
    path: '/path/to/file1.ts',
    content: 'const a: number = 10;',
    language: 'typescript',
  });
  expect(codeBlocks[1]).toEqual({
    path: '/path/to/file2.vue',
    content: '<template>\n  <div>Hello</div>\n</template>',
    language: 'vue',
  });
});

test('extractCodeBlocksFromXML should return empty array if DOMParser is not available', () => {
  const originalDOMParser = (global as any).DOMParser;
  delete (global as any).DOMParser;
  const xmlContent = '<final_codes></final_codes>';
  const codeBlocks = extractCodeBlocksFromXML(xmlContent);
  expect(codeBlocks).toHaveLength(0);
  (global as any).DOMParser = originalDOMParser;
});

test('extractCodeBlocksFromXML should handle parsing errors gracefully', () => {
  const invalidXML = '<final_codes><file></final_codes>';
  const codeBlocks = extractCodeBlocksFromXML(invalidXML);
  expect(codeBlocks).toHaveLength(0);
});

test('parseAIResponse should parse AI response with tagged format and highlight code', () => {
  const aiResponse = `
Some introductory text.
$FinalCodesStart$
File: /path/to/file.js
\`\`\`javascript
console.log("Hello, JS!");
\`\`\`
$FinalCodesEnd$
Some concluding text.
  `;
  const parsed = parseAIResponse(aiResponse);
  expect(parsed).toHaveLength(3);
  expect(parsed[0]).toEqual({ type: 'text', content: 'Some introductory text.' });
  expect(parsed[1]).toEqual({
    type: 'code',
    path: '/path/to/file.js',
    content: 'console.log("Hello, JS!");',
    highlightedCode: 'highlighted-javascript-console.log("Hello, JS!");',
    language: 'javascript',
  });
  expect(parsed[2]).toEqual({ type: 'text', content: 'Some concluding text.' });
  expect(Prism.highlight).toHaveBeenCalledWith(
    'console.log("Hello, JS!");',
    Prism.languages.javascript,
    'javascript'
  );
});

test('parseAIResponse should parse AI response with XML format and highlight Vue code', () => {
  // Mock DOMParser
  (global as any).DOMParser = class {
    parseFromString(input: string, type: string) {
      const { DOMParser: NodeDOMParser } = require('xmldom');
      return new NodeDOMParser().parseFromString(input, type);
    }
  };

  const aiResponse = `
Some text.
<final_codes>
  <file path="/path/to/component.vue">
    <content>
      <![CDATA[
      <template>
        <div>Hello Vue</div>
      </template>
      ]]>
    </content>
  </file>
</final_codes>
More text.
  `;
  const parsed = parseAIResponse(aiResponse);
  expect(parsed).toHaveLength(2);
  expect(parsed[0]).toEqual({ type: 'text', content: 'Some text.' });
  expect(parsed[1]).toEqual({
    type: 'code',
    path: '/path/to/component.vue',
    content: '<template>\n  <div>Hello Vue</div>\n</template>',
    highlightedCode: 'highlighted-vue-<template>\n  <div>Hello Vue</div>\n</template>',
    language: 'vue',
  });
  expect(highlightVueCode).toHaveBeenCalledWith('<template>\n  <div>Hello Vue</div>\n</template>');
});

test('parseAIResponse should handle mixed formats and multiple code blocks', () => {
  // Mock DOMParser
  (global as any).DOMParser = class {
    parseFromString(input: string, type: string) {
      const { DOMParser: NodeDOMParser } = require('xmldom');
      return new NodeDOMParser().parseFromString(input, type);
    }
  };

  const aiResponse = `
Intro text.
$FinalCodesStart$
File: /path/to/file1.py
\`\`\`python
print("Hello Python")
\`\`\`
File: /path/to/file2.js
\`\`\`javascript
console.log("Hello JS");
\`\`\`
$FinalCodesEnd$
Middle text.
<final_codes>
  <file path="/path/to/file3.vue">
    <content>
      <![CDATA[
      <template>
        <div>Vue Component</div>
      </template>
      ]]>
    </content>
  </file>
</final_codes>
End text.
  `;
  const parsed = parseAIResponse(aiResponse);
  expect(parsed).toHaveLength(5);
  expect(parsed[0]).toEqual({ type: 'text', content: 'Intro text.' });
  expect(parsed[1]).toEqual({
    type: 'code',
    path: '/path/to/file1.py',
    content: 'print("Hello Python")',
    highlightedCode: 'highlighted-python-print("Hello Python")',
    language: 'python',
  });
  expect(parsed[2]).toEqual({
    type: 'code',
    path: '/path/to/file2.js',
    content: 'console.log("Hello JS");',
    highlightedCode: 'highlighted-javascript-console.log("Hello JS");',
    language: 'javascript',
  });
  expect(parsed[3]).toEqual({ type: 'text', content: 'Middle text.' });
  expect(parsed[4]).toEqual({
    type: 'code',
    path: '/path/to/file3.vue',
    content: '<template>\n  <div>Vue Component</div>\n</template>',
    highlightedCode: 'highlighted-vue-<template>\n  <div>Vue Component</div>\n</template>',
    language: 'vue',
  });
  expect(Prism.highlight).toHaveBeenCalledWith(
    'print("Hello Python")',
    Prism.languages.python,
    'python'
  );
  expect(Prism.highlight).toHaveBeenCalledWith(
    'console.log("Hello JS");',
    Prism.languages.javascript,
    'javascript'
  );
  expect(highlightVueCode).toHaveBeenCalledWith('<template>\n  <div>Vue Component</div>\n</template>');
});

test('parseAIResponse should handle AI response with no code blocks', () => {
  const aiResponse = 'Just some plain text without any code blocks.';
  const parsed = parseAIResponse(aiResponse);
  expect(parsed).toHaveLength(1);
  expect(parsed[0]).toEqual({ type: 'text', content: 'Just some plain text without any code blocks.' });
});

test('parseAIResponse should handle extraction failures gracefully', () => {
  const aiResponse = 'Malformed content with $FinalCodesStart$ but no end tag.';
  const parsed = parseAIResponse(aiResponse);
  expect(parsed).toHaveLength(0);
});

