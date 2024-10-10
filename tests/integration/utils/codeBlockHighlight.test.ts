import { describe, it, expect } from 'vitest'
import { parseAIResponse } from '~/utils/codeBlockParser/codeBlockHighlight'

describe('codeBlockHighlight', () => {
  describe('parseAIResponse', () => {
    it('should parse AI response with code blocks', () => {
      const input = `
        Here's some code examples:
        <final_codes>
          <file path="example.py">
            <content><![CDATA[
def hello_world():
    print("Hello, World!")
            ]]></content>
          </file>
          <file path="example.js">
            <content><![CDATA[
function helloWorld() {
    console.log("Hello, World!");
}
            ]]></content>
          </file>
        </final_codes>
        That's all for now!
      `

      const result = parseAIResponse(input)

      expect(result.segments).toHaveLength(3)
      expect(result.segments[0]).toEqual({ type: 'text', content: "Here's some code examples:" })
      expect(result.segments[1]).toEqual({
        type: 'file_content',
        files: [
          {
            path: 'example.py',
            originalContent: 'def hello_world():\n    print("Hello, World!")',
            language: 'python',
            highlightedContent: expect.any(String)
          },
          {
            path: 'example.js',
            originalContent: 'function helloWorld() {\n    console.log("Hello, World!");\n}',
            language: 'javascript',
            highlightedContent: expect.any(String)
          }
        ]
      })
      expect(result.segments[2]).toEqual({ type: 'text', content: "That's all for now!" })

      // Check that code was actually highlighted
      expect(result.segments[1].files[0].highlightedContent).not.toBe(result.segments[1].files[0].originalContent)
      expect(result.segments[1].files[1].highlightedContent).not.toBe(result.segments[1].files[1].originalContent)
    })

    it('should handle AI response without code blocks', () => {
      const input = 'This is a response without any code blocks.'

      const result = parseAIResponse(input)

      expect(result.segments).toHaveLength(1)
      expect(result.segments[0]).toEqual({ type: 'text', content: input.trim() })
    })

    it('should handle error in code extraction', () => {
      const input = `
        Here's some invalid XML:
        <final_codes>
          <file>
            <content><![CDATA[This XML is missing a path attribute]]></content>
          </file>
        </final_codes>
      `

      const result = parseAIResponse(input)

      expect(result.segments).toHaveLength(1)
      expect(result.segments[0]).toEqual({ type: 'text', content: input.trim() })
    })

    it('should highlight Vue code correctly', () => {
      const input = `
        Here's some Vue code:
        <final_codes>
          <file path="example.vue">
            <content><![CDATA[
<template>
  <div>{{ message }}</div>
</template>
<script>
export default {
  data() {
    return {
      message: 'Hello Vue!'
    }
  }
}
</script>
            ]]></content>
          </file>
        </final_codes>
      `

      const result = parseAIResponse(input)

      expect(result.segments).toHaveLength(3)
      expect(result.segments[0]).toEqual({ type: 'text', content: "Here's some Vue code:" })
      expect(result.segments[1]).toEqual({
        type: 'file_content',
        files: [{
          path: 'example.vue',
          originalContent: expect.stringContaining('<template>'),
          language: 'vue',
          highlightedContent: expect.any(String)
        }]
      })
      expect(result.segments[2]).toEqual({ type: 'text', content: "" })

      // Check that Vue code was actually highlighted
      expect(result.segments[1].files[0].highlightedContent).not.toBe(result.segments[1].files[0].originalContent)
    })
  })
})