import { describe, it, expect } from 'vitest';
import { parseAIResponse } from '~/utils/aiResponseParser/aiResponseSegmentParser';

describe('aiResponseSegmentParser', () => {
  describe('parseAIResponse', () => {
    it('should parse text without implementation tags into a single text segment', () => {
      const rawText = "This is a simple AI response without any implementation details.";
      const result = parseAIResponse(rawText);
      
      expect(result).toEqual({
        segments: [
          { type: 'text', content: "This is a simple AI response without any implementation details." }
        ]
      });
    });

    it('should parse text with implementation tags into text and implementation segments', () => {
      const rawText = `
        Here is some introductory text.
        <implementation>
          <bash_commands>
            npm install
            npm run build
          </bash_commands>
          <files>
            <file path="path/to/file1.py">
              <content><![CDATA[# Python file content]]></content>
            </file>
          </files>
        </implementation>
        Concluding remarks.
      `;
      const result = parseAIResponse(rawText);
      
      expect(result).toEqual({
        segments: [
          { type: 'text', content: "Here is some introductory text." },
          {
            type: 'bash_commands',
            commands: ['npm install', 'npm run build']
          },
          {
            type: 'file_content',
            fileGroup: {
              files: [
                {
                  path: 'path/to/file1.py',
                  originalContent: '# Python file content',
                  language: 'python'
                }
              ]
            }
          },
          { type: 'text', content: "Concluding remarks." }
        ]
      });
    });

    it('should handle multiple implementation segments correctly', () => {
      const rawText = `
        First part of the response.
        <implementation>
          <bash_commands>
            yarn install
          </bash_commands>
        </implementation>
        Middle text.
        <implementation>
          <files>
            <file path="path/to/app.vue">
              <content><![CDATA[<template><div>Hello</div></template>]]></content>
            </file>
          </files>
        </implementation>
        Final part.
      `;
      const result = parseAIResponse(rawText);
      
      expect(result).toEqual({
        segments: [
          { type: 'text', content: "First part of the response." },
          {
            type: 'bash_commands',
            commands: ['yarn install']
          },
          { type: 'text', content: "Middle text." },
          {
            type: 'file_content',
            fileGroup: {
              files: [
                {
                  path: 'path/to/app.vue',
                  originalContent: '<template><div>Hello</div></template>',
                  language: 'vue'
                }
              ]
            }
          },
          { type: 'text', content: "Final part." }
        ]
      });
    });

    it('should handle empty implementation tags gracefully', () => {
      const rawText = `
        Start text.
        <implementation>
          <bash_commands></bash_commands>
          <files></files>
        </implementation>
        End text.
      `;
      const result = parseAIResponse(rawText);
      
      expect(result).toEqual({
        segments: [
          { type: 'text', content: "Start text." },
          { type: 'text', content: "" },
          { type: 'text', content: "End text." }
        ]
      });
    });
  });
});