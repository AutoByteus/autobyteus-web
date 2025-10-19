import type { ToolParsingStrategy, SignatureMatch } from './base';
import type { ParserContext } from '../stateMachine/ParserContext';

const entityMap: { [key: string]: string } = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
};

const entityRegex = /&[a-zA-Z0-9#]+;/g;

function decodeEntities(text: string): string {
  return text.replace(entityRegex, (entity) => entityMap[entity] || entity);
}

enum WfState {
  AWAITING_ARGUMENTS_OPEN,
  INSIDE_ARGUMENTS,
  STREAMING_ARG_CONTENT,
  AWAITING_TOOL_CLOSE,
  COMPLETE,
  INVALID,
}

export class WriteFileXmlToolParsingStrategy implements ToolParsingStrategy {
  readonly signature = '<tool';

  private internalState: WfState = WfState.AWAITING_ARGUMENTS_OPEN;
  private fullToolBuffer = '';
  private scanBuffer = '';
  private contentBuffer = '';
  private currentArgName: 'path' | 'content' | null = null;
  private args: { path?: string; content?: string } = {};

  checkSignature(buffer: string): SignatureMatch {
    if (buffer.startsWith(this.signature)) {
      return 'match';
    }
    return 'no_match';
  }

  startSegment(context: ParserContext, signatureBuffer: string): void {
    this.fullToolBuffer = signatureBuffer;
    const nameMatch = signatureBuffer.match(/name\s*=\s*['"]([^'"]+)['"]/);
    const rawName = nameMatch ? nameMatch[1] : 'write_file';
    const normalizedName = rawName === 'FileWriter' ? 'write_file' : rawName;
    context.startXmlToolCallSegment(normalizedName);
    context.appendToCurrentToolRawContent(signatureBuffer);
  }

  processChar(char: string, context: ParserContext): void {
    this.fullToolBuffer += char;
    context.appendToCurrentToolRawContent(char);

    switch (this.internalState) {
      case WfState.AWAITING_ARGUMENTS_OPEN:
        this.runSeekTag(char, '<arguments>', WfState.INSIDE_ARGUMENTS);
        break;
      case WfState.INSIDE_ARGUMENTS:
        this.runInsideArguments(char);
        break;
      case WfState.STREAMING_ARG_CONTENT:
        this.runStreamingContent(char, context);
        break;
      case WfState.AWAITING_TOOL_CLOSE:
        this.runSeekTag(char, '</tool>', WfState.COMPLETE);
        break;
    }
  }

  finalize(context: ParserContext): void {
    if (this.isComplete() && this.internalState !== WfState.INVALID) {
      context.updateCurrentToolArguments(this.args);
      context.endCurrentToolSegment();
    } else {
      const parsingSegmentIndex = context.segments.findIndex((s) => s === context.currentSegment);
      if (parsingSegmentIndex !== -1) {
        context.segments.splice(parsingSegmentIndex, 1);
      }
      context.appendTextSegment(this.fullToolBuffer);
    }
  }

  isComplete(): boolean {
    return this.internalState === WfState.COMPLETE || this.internalState === WfState.INVALID;
  }

  private setState(newState: WfState): void {
    if (this.internalState !== newState) {
      this.internalState = newState;
      this.scanBuffer = '';
    }
  }

  private runSeekTag(char: string, targetTag: string, nextState: WfState): void {
    if (!this.scanBuffer.length && /\s/.test(char)) return;

    this.scanBuffer += char;
    if (this.scanBuffer.toLowerCase() === targetTag) {
      this.setState(nextState);
    } else if (!targetTag.startsWith(this.scanBuffer.toLowerCase())) {
      this.setState(WfState.INVALID);
    }
  }

  private runInsideArguments(char: string): void {
    if (this.scanBuffer.length > 0) {
      this.scanBuffer += char;
      const lowerBuffer = this.scanBuffer.toLowerCase();

      if (char === '>') {
        this.scanBuffer = '';
        if (lowerBuffer === '</arguments>') {
          this.setState(WfState.AWAITING_TOOL_CLOSE);
          return;
        }

        const pathMatch = /<arg\s+name=["']path["']>/.exec(lowerBuffer);
        const contentMatch = /<arg\s+name=["']content["']>/.exec(lowerBuffer);

        if (pathMatch) {
          this.currentArgName = 'path';
          this.setState(WfState.STREAMING_ARG_CONTENT);
        } else if (contentMatch) {
          this.currentArgName = 'content';
          this.setState(WfState.STREAMING_ARG_CONTENT);
        } else {
          this.setState(WfState.INVALID);
        }
      } else {
        const couldBeArg = lowerBuffer.startsWith('<arg') || '<arg'.startsWith(lowerBuffer);
        const couldBeClosing = '</arguments>'.startsWith(lowerBuffer);
        if (!couldBeArg && !couldBeClosing) {
          this.setState(WfState.INVALID);
        }
      }
    } else {
      if (char === '<') {
        this.scanBuffer = '<';
      } else if (!/\s/.test(char)) {
        this.setState(WfState.INVALID);
      }
    }
  }

  private runStreamingContent(char: string, context: ParserContext): void {
    this.contentBuffer += char;
    const terminator = '</arg>';

    if (this.contentBuffer.toLowerCase().endsWith(terminator)) {
      const finalContent = this.contentBuffer.slice(0, -terminator.length);

      if (this.currentArgName) {
        const processedContent =
          this.currentArgName === 'content' ? finalContent : decodeEntities(finalContent);
        this.args[this.currentArgName] = processedContent;
        context.updateCurrentToolArguments(this.args);
      }

      this.contentBuffer = '';
      this.currentArgName = null;
      this.setState(WfState.INSIDE_ARGUMENTS);
    } else if (this.currentArgName) {
      const processedContent =
        this.currentArgName === 'content' ? this.contentBuffer : decodeEntities(this.contentBuffer);
      this.args[this.currentArgName] = processedContent;
      context.updateCurrentToolArguments(this.args);
    }
  }
}
