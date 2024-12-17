import { parseXmlSegment } from '~/utils/aiResponseParser/xmlImplementationParser';
import type { AIResponseSegment } from '~/utils/aiResponseParser/types';

export class IncrementalAIResponseParser {
  private buffer: string = '';
  private tagStack: string[] = [];

  constructor(private segments: AIResponseSegment[]) {}

  /**
   * Process only the new incoming chunks. 
   * The chunks array passed should contain ONLY new data that hasn't been processed yet.
   */
  processChunks(chunks: string[]) {
    const newContent = chunks.join('');

    // Append the newContent to buffer
    // We keep the entire processed content in 'buffer', so we can handle partial tags, etc.
    const startLength = this.buffer.length;
    this.buffer += newContent;

    let idx = startLength;
    while (idx < this.buffer.length) {
      if (this.tagStack.length === 0) {
        const nextTagStart = this.buffer.indexOf('<', idx);
        if (nextTagStart === -1) {
          this.appendTextSegment(this.buffer.substring(idx));
          break;
        } else {
          if (nextTagStart > idx) {
            this.appendTextSegment(this.buffer.substring(idx, nextTagStart));
          }
          idx = nextTagStart;
          const tagMatch = this.buffer.substring(idx).match(/^<(\w+)/);
          if (tagMatch) {
            this.tagStack.push(tagMatch[1]);
          } else {
            idx++;
          }
        }
      } else {
        const currentTag = this.tagStack[this.tagStack.length - 1];
        const endTag = `</${currentTag}>`;
        const endTagIdx = this.buffer.indexOf(endTag, idx);
        if (endTagIdx !== -1) {
          const fullTagContent = this.buffer.substring(idx, endTagIdx + endTag.length);
          this.parseAndAppendSegment(fullTagContent);
          idx = endTagIdx + endTag.length;
          this.tagStack.pop();
        } else {
          // Not all data for this tag has arrived yet. Stop parsing until more chunks come in.
          break;
        }
      }
    }

    return this.segments;
  }

  private appendTextSegment(text: string) {
    if (text.trim().length === 0) return;
    const lastSegment = this.segments[this.segments.length - 1];
    if (lastSegment && lastSegment.type === 'text') {
      lastSegment.content += text;
    } else {
      this.segments.push({ type: 'text', content: text });
    }
  }

  private parseAndAppendSegment(xmlContent: string) {
    try {
      const segment = parseXmlSegment(xmlContent);
      if ('command' in segment) {
        this.segments.push({
          type: 'bash_command',
          command: segment.command,
          description: segment.description,
        });
      } else if ('path' in segment) {
        this.segments.push({
          type: 'file',
          path: segment.path,
          originalContent: segment.originalContent,
          language: segment.language,
        });
      }
    } catch (error) {
      console.error('Failed to parse segment:', error);
      // Treat this xmlContent as text if parse fails
      this.appendTextSegment(xmlContent);
    }
  }
}