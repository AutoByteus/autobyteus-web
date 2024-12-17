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
    // Append new chunks to buffer
    this.buffer += chunks.join('');

    // Attempt to parse as much as possible from this.buffer
    this.parseBuffer();

    return this.segments;
  }

  private parseBuffer(): void {
    let i = 0;
    // We'll re-parse until no more progress can be made in this invocation
    // This is to handle partial tags without losing state between calls
    // Each pass tries to consume the buffer fully, if partial data remains for a tag,
    // we leave it in the buffer and wait for more chunks.
    parseLoop: while (i < this.buffer.length) {
      const char = this.buffer[i];

      if (this.currentTag === null) {
        // Not currently inside a file or bash tag
        if (char === '<') {
          // Potential start of a tag. Let's accumulate in tagBuffer and see what we get.
          this.tagBuffer = '<';
          i++;
          let tagParsed = false;
          while (i < this.buffer.length && !tagParsed) {
            this.tagBuffer += this.buffer[i];
            // Check if we identified a tag start
            if (this.tagBuffer.startsWith('<bash')) {
              // Check if we have the full bash tag
              const closeIdx = this.tagBuffer.indexOf('/>');
              if (closeIdx !== -1) {
                // We have a complete bash tag
                const fullTag = this.tagBuffer.slice(0, closeIdx + 2);
                this.parseBashTag(fullTag);
                // Remove the parsed part from buffer
                this.buffer = this.buffer.slice(i + 1 - (this.tagBuffer.length - (closeIdx + 2)));
                // Adjust i to restart parsing from beginning of new buffer content
                i = 0;
                tagParsed = true;
              } else {
                i++;
              }
            } else if (this.tagBuffer.startsWith('<file')) {
              // Check if we have reached the end of the opening file tag (i.e. '>')
              const gtIdx = this.tagBuffer.indexOf('>');
              if (gtIdx !== -1) {
                // We have a complete opening <file ...> tag
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
                }
                // Remove the parsed tag part from buffer, keep the rest
                this.buffer = this.buffer.slice(i + 1 - (this.tagBuffer.length - (gtIdx + 1)));
                i = 0;
                this.currentTag = 'file';
                this.tagBuffer = '';
                tagParsed = true;
              } else {
                i++;
              }
            } else if (this.tagBuffer.length > 1 && !this.tagBuffer.startsWith('<bash') && !this.tagBuffer.startsWith('<file')) {
              // It's not a recognized tag, once we reach a character that makes it impossible
              // to match <bash or <file, we revert to treating the accumulated data as text.
              // But we must be careful: We need to break as soon as we realize it's not matching
              // recognized tags. A recognized start is '<bash' or '<file'. If we have something else,
              // it's just text.
              // Check conditions:
              if (!( '<bash'.startsWith(this.tagBuffer) || '<file'.startsWith(this.tagBuffer) )) {
                // This means the tagBuffer doesn't match any recognized tag prefix
                // We revert all this back to text.
                this.appendText(this.tagBuffer);
                // Remove these chars from the buffer
                this.buffer = this.buffer.slice(i + 1 - this.tagBuffer.length);
                i = 0;
                this.tagBuffer = '';
                tagParsed = true;
              } else {
                // Still might match if we get more chars, continue reading
                i++;
              }
            } else {
              // Need more chars to decide what tag it is (or if it doesn't match any recognized tags yet)
              i++;
            }
          }

          // If we exited the while loop due to end of buffer and haven't identified a tag,
          // we must wait for more chunks. tagBuffer is kept as is until we get more data.
          if (!tagParsed) {
            // This means partial tag, we just stop parsing now, wait for more data.
            break parseLoop;
          }
        } else {
          // Regular text char
          this.appendText(char);
          i++;
        }
      } else if (this.currentTag === 'bash') {
        // We never stay in bash tag, because bash tags are self-closing <bash ... />
        // Once parsed, we reset currentTag immediately. So we should never reach here.
        i++;
      } else if (this.currentTag === 'file') {
        // We are inside file content until we find </file>
        const closingTagIdx = this.buffer.indexOf('</file>', i);
        if (this.currentSegment) {
          if (closingTagIdx === -1) {
            // No closing tag found, append all remaining as content
            this.currentSegment.originalContent += this.buffer.slice(i);
            // Clear parsed part from buffer
            this.buffer = '';
            // We consumed everything, wait for more data
            break parseLoop;
          } else {
            // We found a closing tag
            const content = this.buffer.slice(i, closingTagIdx);
            this.currentSegment.originalContent += content;
            // Remove up to closing tag from buffer
            this.buffer = this.buffer.slice(closingTagIdx + '</file>'.length);
            i = 0; // reset i to re-parse from start of remaining buffer
            this.currentTag = null;
            this.currentSegment = null;
          }
        } else {
          // We are in a 'file' tag but currentSegment is null - should not happen if code is correct
          // If it does, treat everything as text
          this.appendText(this.buffer[i]);
          i++;
        }
      }
    }
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
