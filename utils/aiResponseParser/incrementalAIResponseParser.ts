import { parseXmlSegment } from '~/utils/aiResponseParser/xmlImplementationParser';
import type { AIResponseSegment, BashCommand, ParsedFile } from '~/utils/aiResponseParser/types';

export class IncrementalAIResponseParser {
  private buffer: string = '';
  private segments: AIResponseSegment[] = [];
  private tagStack: string[] = [];

  processChunks(chunks: string[]): AIResponseSegment[] {
    const combinedText = chunks.join('');
    const newContent = combinedText.substring(this.buffer.length);
    this.buffer += newContent;

    let idx = 0;
    while (idx < newContent.length) {
      if (this.tagStack.length === 0) {
        const nextTagStart = newContent.indexOf('<', idx);
        if (nextTagStart === -1) {
          this.appendTextSegment(newContent.substring(idx));
          break;
        } else {
          if (nextTagStart > idx) {
            this.appendTextSegment(newContent.substring(idx, nextTagStart));
          }
          idx = nextTagStart;
          const tagMatch = newContent.substring(idx).match(/^<(\w+)/);
          if (tagMatch) {
            this.tagStack.push(tagMatch[1]);
          } else {
            idx++;
          }
        }
      } else {
        const currentTag = this.tagStack[this.tagStack.length - 1];
        const endTag = `</${currentTag}>`;
        const endTagIdx = newContent.indexOf(endTag, idx);
        if (endTagIdx !== -1) {
          const fullTagContent = newContent.substring(idx, endTagIdx + endTag.length);
          this.parseAndAppendSegment(fullTagContent);
          idx = endTagIdx + endTag.length;
          this.tagStack.pop();
        } else {
          break; // Wait for more content
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
      this.appendTextSegment(xmlContent);
    }
  }
}