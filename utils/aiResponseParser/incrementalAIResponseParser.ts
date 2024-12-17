import type { 
  AIResponseSegment, 
  FileSegment, 
  BashCommandSegment, 
  AIResponseTextSegment 
} from '~/utils/aiResponseParser/types';
import { getLanguage } from '~/utils/aiResponseParser/languageDetector';

export class IncrementalAIResponseParser {
  private buffer: string = '';
  private currentTag: 'bash' | 'file' | null = null;
  private currentSegment: FileSegment | null = null;
  private tagBuffer: string = '';

  constructor(private segments: AIResponseSegment[]) {}

  processChunks(chunks: string[]): AIResponseSegment[] {
    const combinedText = chunks.join('');
    this.buffer += combinedText;

    let idx = 0;
    while (idx < combinedText.length) {
      const char = combinedText[idx];

      if (this.currentTag === null) {
        if (char === '<') {
          // Possible start of a tag
          const potentialTag = combinedText.substring(idx);
          if (potentialTag.startsWith('<bash')) {
            this.currentTag = 'bash';
            this.tagBuffer = '<bash';
            idx += '<bash'.length;
          } else if (potentialTag.startsWith('<file')) {
            this.currentTag = 'file';
            this.tagBuffer = '<file';
            idx += '<file'.length;
          } else {
            // Not a recognized tag, treat as text
            this.appendText(char);
            idx += 1;
          }
        } else {
          // Regular text
          this.appendText(char);
          idx += 1;
        }
      } else if (this.currentTag === 'bash') {
        // Inside a <bash ... /> tag
        // Buffer until the closing '/>' is found
        this.tagBuffer += char;
        if (char === '>') {
          if (this.tagBuffer.endsWith('/>')) {
            // Complete bash tag found
            const bashTag = this.tagBuffer;
            this.parseBashTag(bashTag);
            this.currentTag = null;
            this.tagBuffer = '';
          }
        }
        idx += 1;
      } else if (this.currentTag === 'file') {
        // Inside a <file ...> tag
        if (this.currentSegment === null) {
          // Parsing the opening tag to get the file path
          this.tagBuffer += char;
          if (char === '>') {
            // Complete opening tag
            const fileTag = this.tagBuffer;
            const pathMatch = fileTag.match(/path=['"]([^'"]+)['"]/);
            if (pathMatch) {
              const filePath = pathMatch[1];
              const newFileSegment: FileSegment = {
                type: 'file',
                path: filePath,
                originalContent: '',
                language: getLanguage(filePath),
              };
              this.currentSegment = newFileSegment;
              this.segments.push(newFileSegment);
            }
            this.tagBuffer = '';
          }
          idx += 1;
        } else {
          // Inside file content, look for closing </file> tag
          const remainingText = combinedText.substring(idx);
          const closingTagIdx = remainingText.indexOf('</file>');
          if (closingTagIdx !== -1) {
            // Append content up to closing tag
            const content = remainingText.substring(0, closingTagIdx);
            this.currentSegment.originalContent += content;
            // Move index past closing tag
            idx += closingTagIdx + '</file>'.length;
            // Reset current tag and segment
            this.currentTag = null;
            this.currentSegment = null;
          } else {
            // Append all remaining content
            const content = remainingText;
            this.currentSegment.originalContent += content;
            idx = combinedText.length; // Processed all
          }
        }
      }
    }

    return this.segments;
  }

  private appendText(text: string): void {
    const lastSegment = this.segments[this.segments.length - 1];
    if (lastSegment && lastSegment.type === 'text') {
      const textSegment = lastSegment as AIResponseTextSegment;
      textSegment.content += text;
    } else {
      const newTextSegment: AIResponseTextSegment = { type: 'text', content: text };
      this.segments.push(newTextSegment);
    }
  }

  private parseBashTag(tag: string): void {
    // Example tag: <bash command="your_command_here" description="Brief description" />
    const commandMatch = tag.match(/command=['"]([^'"]+)['"]/);
    const descriptionMatch = tag.match(/description=['"]([^'"]+)['"]/);
    if (commandMatch) {
      const command = commandMatch[1];
      const description = descriptionMatch ? descriptionMatch[1] : '';
      const bashCommandSegment: BashCommandSegment = {
        type: 'bash_command',
        command,
        description,
      };
      this.segments.push(bashCommandSegment);
    }
  }
}