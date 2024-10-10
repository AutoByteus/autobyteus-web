import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils'
import { extractCodeBlocksFromXML } from '~/utils/codeBlockParser/xmlCodeBlockParser'

describe('xmlCodeBlockParser', () => {
  describe('extractCodeBlocksFromXML', () => {
    it('should extract code blocks from valid XML', () => {
      const xmlContent = `
        <final_codes>
          <file path="path/to/file1.py">
            <content><![CDATA[# File content 1]]></content>
          </file>
          <file path="path/to/file2.js">
            <content><![CDATA[// File content 2]]></content>
          </file>
        </final_codes>
      `
      const result = extractCodeBlocksFromXML(xmlContent)
      
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        path: 'path/to/file1.py',
        originalContent: '# File content 1',
        language: 'python'
      })
      expect(result[1]).toEqual({
        path: 'path/to/file2.js',
        originalContent: '// File content 2',
        language: 'javascript'
      })
    })

    it('should throw an error for invalid XML', () => {
      const invalidXML = '<invalid>XML</invalid>'
      expect(() => extractCodeBlocksFromXML(invalidXML)).toThrow('XML content not found or incomplete')
    })

    it('should return an empty array when no code blocks are found', () => {
      const xmlContent = '<final_codes></final_codes>'
      const result = extractCodeBlocksFromXML(xmlContent)
      expect(result).toEqual([])
    })

    it('should handle mixed content (CDATA and text nodes)', () => {
      const xmlContent = `
        <final_codes>
          <file path="path/to/mixed.txt">
            <content>Text before <![CDATA[CDATA content]]> Text after</content>
          </file>
        </final_codes>
      `
      const result = extractCodeBlocksFromXML(xmlContent)
      
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        path: 'path/to/mixed.txt',
        originalContent: 'Text before CDATA content Text after',
        language: 'plaintext'
      })
    })

    it('should extract code blocks from XML surrounded by other text', () => {
      const content = `
        This is some text before the XML content.
        Here's a code block:

        <final_codes>
          <file path="path/to/file1.py">
            <content><![CDATA[
# Python code
def hello_world():
    print("Hello, World!")
            ]]></content>
          </file>
          <file path="path/to/file2.js">
            <content><![CDATA[
// JavaScript code
function helloWorld() {
    console.log("Hello, World!");
}
            ]]></content>
          </file>
        </final_codes>

        And here's some text after the XML content.
        The parser should ignore this text and only extract the code blocks.
      `

      const result = extractCodeBlocksFromXML(content)
      
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        path: 'path/to/file1.py',
        originalContent: `
# Python code
def hello_world():
    print("Hello, World!")
            `.trim(),
        language: 'python'
      })
      expect(result[1]).toEqual({
        path: 'path/to/file2.js',
        originalContent: `
// JavaScript code
function helloWorld() {
    console.log("Hello, World!");
}
            `.trim(),
        language: 'javascript'
      })
    })
  })
})