import { describe, it, expect } from 'vitest';
import { parseXmlImplementation } from '~/utils/aiResponseParser/xmlImplementationParser';

describe('xmlImplementationParser', () => {
  describe('parseXmlImplementation', () => {
    it('should parse valid XML with bash commands and files correctly', () => {
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
      `;
      const result = parseXmlImplementation(xmlContent);

      expect(result).toEqual({
        bashCommands: {
          commands: ['Setup environment', 'npm install', 'npm run build']
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
      });
    });

    it('should throw an error for XML without <implementation> tag', () => {
      const xmlContent = `
        <data>
          <bash_commands>
            Some commands
          </bash_commands>
        </data>
      `;
      expect(() => parseXmlImplementation(xmlContent)).toThrow('Required <implementation> tag not found in XML content.');
    });

    it('should throw an error for malformed XML', () => {
      const malformedXML = `
        <implementation>
          <bash_commands>
            Missing closing tags
      `;
      expect(() => parseXmlImplementation(malformedXML)).toThrow('Failed to parse XML implementation content.');
    });

    it('should handle empty <bash_commands> and <files> gracefully', () => {
      const xmlContent = `
        <implementation>
          <bash_commands></bash_commands>
          <files></files>
        </implementation>
      `;
      const result = parseXmlImplementation(xmlContent);

      expect(result).toEqual({
        bashCommands: {
          commands: []
        },
        files: []
      });
    });

    it('should correctly extract multiple files with different languages', () => {
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
      `;
      const result = parseXmlImplementation(xmlContent);

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
      ]);
    });

    it('should include files with path even if content is missing or empty', () => {
      const xmlContent = `
        <implementation>
          <bash_commands>
            Some commands
          </bash_commands>
          <files>
            <file path="path/to/file3.js">
              <!-- Missing content -->
            </file>
            <file path="path/to/file4.rb">
              <content><![CDATA[puts 'Hello World']]></content>
            </file>
            <file path="path/to/__init__.py">
              <content><![CDATA[]]></content>
            </file>
          </files>
        </implementation>
      `;
      const result = parseXmlImplementation(xmlContent);

      expect(result.files).toEqual([
        {
          path: 'path/to/file3.js',
          originalContent: '',
          language: 'javascript'
        },
        {
          path: 'path/to/file4.rb',
          originalContent: "puts 'Hello World'",
          language: 'ruby'
        },
        {
          path: 'path/to/__init__.py',
          originalContent: '',
          language: 'python'
        }
      ]);
    });

    it('should ignore comment lines in bash_commands', () => {
      const xmlContent = `
        <implementation>
          <bash_commands>
            # Install required dependencies
            pip install jinja2
            # Apply migrations
            python manage.py makemigrations
            python manage.py migrate
          </bash_commands>
          <files>
            <file path="path/to/settings.py">
              <content><![CDATA[# Django settings]]></content>
            </file>
          </files>
        </implementation>
      `;
      const result = parseXmlImplementation(xmlContent);

      expect(result).toEqual({
        bashCommands: {
          commands: ['pip install jinja2', 'python manage.py makemigrations', 'python manage.py migrate']
        },
        files: [
          {
            path: 'path/to/settings.py',
            originalContent: '# Django settings',
            language: 'python'
          }
        ]
      });
    });

    it('should handle bash_commands with interleaved comments and commands', () => {
      const xmlContent = `
        <implementation>
          <bash_commands>
            # Start setup
            echo "Setting up environment"
            # Install packages
            npm install express
            # End setup
          </bash_commands>
        </implementation>
      `;
      const result = parseXmlImplementation(xmlContent);

      expect(result).toEqual({
        bashCommands: {
          commands: ['echo "Setting up environment"', 'npm install express']
        },
        files: []
      });
    });
  });
});