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
  // For file content, we'll buffer insideFileContent until we confirm closing tag
  private insideFileContent: string = '';

  constructor(private segments: AIResponseSegment[]) {}

  processChunks(chunks: string[]): AIResponseSegment[] {
    // Append new chunks to the buffer
    this.buffer += chunks.join('');

    // Parse as much as possible from the buffer
    this.parseBuffer();

    return this.segments;
  }

  private parseBuffer(): void {
    let i = 0;

    parseLoop: while (i < this.buffer.length) {
      const char = this.buffer[i];

      if (this.currentTag === null) {
        // Not currently inside a recognized tag
        if (char === '<') {
          // Potential start of a tag
          this.tagBuffer = '<';
          i++;
          let tagParsed = false;
          while (i < this.buffer.length && !tagParsed) {
            this.tagBuffer += this.buffer[i];

            // Check if we recognized a <bash ... /> tag
            if (this.tagBuffer.startsWith('<bash')) {
              const closeIdx = this.tagBuffer.indexOf('/>');
              if (closeIdx !== -1) {
                // Complete bash tag found
                const fullTag = this.tagBuffer.slice(0, closeIdx + 2);
                this.parseBashTag(fullTag);

                // Remove parsed portion from buffer
                const consumedLength = (this.tagBuffer.length - (this.tagBuffer.length - (closeIdx + 2)));
                this.buffer = this.buffer.slice(i + 1 - consumedLength);
                i = 0; 
                tagParsed = true;
              } else {
                i++;
              }

            } else if (this.tagBuffer.startsWith('<file')) {
              // Check if we have full opening file tag (ends at '>')
              const gtIdx = this.tagBuffer.indexOf('>');
              if (gtIdx !== -1) {
                // Complete file tag
                const fileTag = this.tagBuffer.slice(0, gtIdx + 1);
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
                  this.insideFileContent = '';
                }

                // Remove parsed portion from buffer
                const consumedLength = (this.tagBuffer.length - (this.tagBuffer.length - (gtIdx + 1)));
                this.buffer = this.buffer.slice(i + 1 - consumedLength);
                i = 0;
                this.currentTag = 'file';
                this.tagBuffer = '';
                tagParsed = true;
              } else {
                i++;
              }

            } else if (
              this.tagBuffer.length > 1 && 
              !this.tagBuffer.startsWith('<bash') && 
              !this.tagBuffer.startsWith('<file')
            ) {
              // Not a recognized tag start. Revert to text
              this.appendText(this.tagBuffer);
              this.buffer = this.buffer.slice(i + 1 - this.tagBuffer.length);
              i = 0;
              this.tagBuffer = '';
              tagParsed = true;

            } else {
              // Not yet determined if this is a known tag; need more chars
              i++;
            }
          }

          if (!tagParsed) {
            // Partial tag - wait for more data
            break parseLoop;
          }
        } else {
          // Just text
          this.appendText(char);
          i++;
        }

      } else if (this.currentTag === 'file') {
        // Inside file content until we find '</file>'
        const closingTagIdx = this.buffer.indexOf('</file>', i);
        if (this.currentSegment) {
          if (closingTagIdx === -1) {
            // No closing tag found yet, consume all as content
            this.insideFileContent += this.buffer.slice(i);
            this.buffer = '';
            break parseLoop;
          } else {
            // Closing tag found
            const content = this.buffer.slice(i, closingTagIdx);
            this.insideFileContent += content;

            // Assign final content to current segment
            this.currentSegment.originalContent = this.insideFileContent;
            this.insideFileContent = '';

            // Remove up to and including closing tag from buffer
            this.buffer = this.buffer.slice(closingTagIdx + '</file>'.length);
            i = 0;
            this.currentTag = null;
            this.currentSegment = null;
          }
        } else {
          // If no currentSegment, treat as text (unexpected scenario)
          this.appendText(this.buffer[i]);
          i++;
        }
      }
    }
  }

  private appendText(text: string): void {
    const lastSegment = this.segments[this.segments.length - 1];
    if (lastSegment && lastSegment.type === 'text') {
      (lastSegment as AIResponseTextSegment).content += text;
    } else {
      const newTextSegment: AIResponseTextSegment = { type: 'text', content: text };
      this.segments.push(newTextSegment);
    }
  }

  private parseBashTag(tag: string): void {
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
