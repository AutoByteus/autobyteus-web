import { describe, it, expect } from 'vitest'
import { extractImplementation } from '~/utils/codeBlockParser/codeBlockExtractor'

describe('codeBlockExtractor', () => {
  describe('extractImplementation', () => {
    it('should extract bash commands and files from valid XML', () => {
      const xmlContent = `
        <implementation>
          <bash_commands>
            Setup environment
            npm install
            npm run build
          </bash_commands>
          <files>
            <file path="path/to/file1.py">
              <content><![CDATA[# Python file content]]></content>
            </file>
            <file path="path/to/file2.js">
              <content><![CDATA[// JavaScript file content]]></content>
            </file>
          </files>
        </implementation>
      `
      const result = extractImplementation(xmlContent)
      
      expect(result).toEqual({
        bashCommands: {
          description: 'Setup environment',
          commands: ['npm install', 'npm run build']
        },
        files: [
          {
            path: 'path/to/file1.py',
            originalContent: '# Python file content',
            language: 'python'
          },
          {
            path: 'path/to/file2.js',
            originalContent: '// JavaScript file content',
            language: 'javascript'
          }
        ]
      })
    })

    it('should throw an error for invalid XML', () => {
      const invalidXML = '<invalid>XML</invalid>'
      expect(() => extractImplementation(invalidXML)).toThrow('Error parsing implementation XML.')
    })

    it('should throw an error when <implementation> tag is missing', () => {
      const xmlContent = `
        <data>
          <bash_commands>
            Some commands
          </bash_commands>
        </data>
      `
      expect(() => extractImplementation(xmlContent)).toThrow('<implementation> tag not found.')
    })

    it('should handle empty <bash_commands> and <files>', () => {
      const xmlContent = `
        <implementation>
          <bash_commands></bash_commands>
          <files></files>
        </implementation>
      `
      const result = extractImplementation(xmlContent)
      
      expect(result).toEqual({
        bashCommands: {
          description: '',
          commands: []
        },
        files: []
      })
    })

    it('should handle mixed content in <bash_commands>', () => {
      const xmlContent = `
        <implementation>
          <bash_commands>
            Description line
            command1
            command2
          </bash_commands>
          <files>
            <file path="path/to/file1.py">
              <content><![CDATA[# Python code]]></content>
            </file>
          </files>
        </implementation>
      `
      const result = extractImplementation(xmlContent)
      
      expect(result.bashCommands.description).toBe('Description line')
      expect(result.bashCommands.commands).toEqual(['command1', 'command2'])
    })

    it('should extract files correctly with different extensions', () => {
      const xmlContent = `
        <implementation>
          <bash_commands>
            Initialize project
            yarn install
          </bash_commands>
          <files>
            <file path="path/to/app.vue">
              <content><![CDATA[<template><div>Hello</div></template>]]></content>
            </file>
            <file path="path/to/index.html">
              <content><![CDATA[<!DOCTYPE html><html></html>]]></content>
            </file>
            <file path="path/to/script.php">
              <content><![CDATA[<?php echo "Hello"; ?>]]></content>
            </file>
          </files>
        </implementation>
      `
      const result = extractImplementation(xmlContent)
      
      expect(result.files).toEqual([
        {
          path: 'path/to/app.vue',
          originalContent: '<template><div>Hello</div></template>',
          language: 'vue'
        },
        {
          path: 'path/to/index.html',
          originalContent: '<!DOCTYPE html><html></html>',
          language: 'markup'
        },
        {
          path: 'path/to/script.php',
          originalContent: '<?php echo "Hello"; ?>',
          language: 'php'
        }
      ])
    })
  })
})