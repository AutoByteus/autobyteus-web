import { describe, it, expect } from 'vitest';
import { parseAIResponse } from '~/utils/aiResponseParser/aiResponseSegmentParser';

describe('aiResponseSegmentParser', () => {
  describe('parseAIResponse', () => {
    it('should parse text with individual bash commands and files into separate segments', () => {
      const rawText = `
        Here is some introductory text.
        <bash command="npm install" description="Install dependencies" />
        <file path="src/utils/formatter.ts">
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
        Concluding remarks.
      `;
      const result = parseAIResponse(rawText);
      
      expect(result).toEqual({
        segments: [
          { type: 'text', content: "Here is some introductory text." },
          { 
            type: 'bash_command', 
            command: "npm install", 
            description: "Install dependencies" 
          },
          { 
            type: 'file', 
            path: "src/utils/formatter.ts", 
            originalContent: `export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}`, 
            language: "typescript" 
          },
          { type: 'text', content: "Concluding remarks." },
        ],
      });
    });

    it('should correctly parse interleaved text, bash commands, and files', () => {
      const rawText = `
        Starting the setup process.
        <bash command="git clone https://github.com/example/repo.git" description="Clone the repository" />
        <file path="repo/README.md">
          <![CDATA[
# Project Repository

This repository contains the project source code.
          ]]>
        </file>
        <bash command="cd repo" description="Navigate into the repository directory" />
        <file path="repo/src/index.js">
          <![CDATA[
import express from 'express';

const app = express();

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
          ]]>
        </file>
        Setup complete.
      `;
      const result = parseAIResponse(rawText);
      
      expect(result).toEqual({
        segments: [
          { type: 'text', content: "Starting the setup process." },
          { 
            type: 'bash_command', 
            command: "git clone https://github.com/example/repo.git", 
            description: "Clone the repository" 
          },
          { 
            type: 'file', 
            path: "repo/README.md", 
            originalContent: `# Project Repository

This repository contains the project source code.`, 
            language: "markdown" 
          },
          { 
            type: 'bash_command', 
            command: "cd repo", 
            description: "Navigate into the repository directory" 
          },
          { 
            type: 'file', 
            path: "repo/src/index.js", 
            originalContent: `import express from 'express';

const app = express();

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});`, 
            language: "javascript" 
          },
          { type: 'text', content: "Setup complete." },
        ],
      });
    });

    it('should handle multiple interleaved segments correctly', () => {
      const rawText = `
        Initializing environment.
        <file path="config/.env">
          <![CDATA[
DB_HOST=localhost
DB_USER=root
DB_PASS=s1mpl3
          ]]>
        </file>
        <bash command="npm run migrate" description="Run database migrations" />
        This is some additional setup information.
        <bash command="npm start" description="Start the application" />
        <file path="src/app.ts">
          <![CDATA[
import express from 'express';

const app = express();

app.get('/', (req, res) => {
  res.send('App is running!');
});

app.listen(4000, () => {
  console.log('App listening on port 4000');
});
          ]]>
        </file>
        Environment setup finished.
      `;
      const result = parseAIResponse(rawText);
      
      expect(result).toEqual({
        segments: [
          { type: 'text', content: "Initializing environment." },
          { 
            type: 'file', 
            path: "config/.env", 
            originalContent: `DB_HOST=localhost
DB_USER=root
DB_PASS=s1mpl3`, 
            language: "plaintext" 
          },
          { 
            type: 'bash_command', 
            command: "npm run migrate", 
            description: "Run database migrations" 
          },
          { type: 'text', content: "This is some additional setup information." },
          { 
            type: 'bash_command', 
            command: "npm start", 
            description: "Start the application" 
          },
          { 
            type: 'file', 
            path: "src/app.ts", 
            originalContent: `import express from 'express';

const app = express();

app.get('/', (req, res) => {
  res.send('App is running!');
});

app.listen(4000, () => {
  console.log('App listening on port 4000');
});`, 
            language: "typescript" 
          },
          { type: 'text', content: "Environment setup finished." },
        ],
      });
    });
  });
});