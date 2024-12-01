import { describe, it, expect } from 'vitest';
import { parseXmlSegment } from '~/utils/aiResponseParser/xmlImplementationParser';

describe('xmlImplementationParser', () => {
  describe('parseXmlSegment', () => {
    it('should parse valid <bash> XML correctly', () => {
      const xmlContent = `<bash command="mkdir -p src/utils" description="Create utils directory" />`;
      const result = parseXmlSegment(xmlContent);
      
      expect(result).toEqual({
        command: 'mkdir -p src/utils',
        description: 'Create utils directory'
      });
    });

    it('should parse valid <file> XML correctly', () => {
      const xmlContent = `<file path="src/utils/formatter.ts">
          <![CDATA[
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}
          ]]>
        </file>
      `;
      const result = parseXmlSegment(xmlContent);
      
      expect(result).toEqual({
        path: 'src/utils/formatter.ts',
        originalContent: `export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}`,
        language: 'typescript'
      });
    });

    it('should throw an error for XML without <bash> or <file> tags', () => {
      const xmlContent = `<unknown tag="value" />`;
      expect(() => parseXmlSegment(xmlContent)).toThrow('Unknown XML segment type.');
    });

    it('should throw an error for malformed <bash> XML', () => {
      const malformedXml = `<bash command="npm install" description="Install dependencies">`;
      expect(() => parseXmlSegment(malformedXml)).toThrow('Failed to parse XML segment content.');
    });

    it('should throw an error if <bash> tag is missing the "command" attribute', () => {
      const xmlContent = `<bash description="Missing command attribute" />`;
      expect(() => parseXmlSegment(xmlContent)).toThrow('Bash command is missing the "command" attribute.');
    });

    it('should throw an error if <file> tag is missing the "path" attribute', () => {
      const xmlContent = `
        <file>
          <![CDATA[console.log('Hello World');]]>
        </file>
      `;
      expect(() => parseXmlSegment(xmlContent)).toThrow('File is missing the "path" attribute.');
    });

    it('should handle <file> tags with empty content', () => {
      const xmlContent = `
        <file path="src/utils/empty.ts">
          <![CDATA[]]>
        </file>
      `;
      const result = parseXmlSegment(xmlContent);
      
      expect(result).toEqual({
        path: 'src/utils/empty.ts',
        originalContent: '',
        language: 'typescript'
      });
    });

    it('should ignore comment lines in <bash> descriptions', () => {
      const xmlContent = `<bash command="npm install" description="# Install dependencies" />`;
      const result = parseXmlSegment(xmlContent);
      
      expect(result).toEqual({
        command: 'npm install',
        description: '# Install dependencies'
      });
    });
  });
});