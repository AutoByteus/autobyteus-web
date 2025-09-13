import type { ToolParsingStrategy, SignatureMatch } from './base';
import type { ParserContext } from '../stateMachine/ParserContext';

const entityMap: { [key: string]: string } = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'"
};
const entityRegex = /&[a-zA-Z0-9#]+;/g;
function decodeEntities(text: string): string {
  return text.replace(entityRegex, (entity) => entityMap[entity] || entity);
}

enum FwState {
  AWAITING_ARGUMENTS_OPEN,
  INSIDE_ARGUMENTS,
  STREAMING_ARG_CONTENT,
  AWAITING_TOOL_CLOSE,
  COMPLETE,
  INVALID,
}

export class FileWriterXmlToolParsingStrategy implements ToolParsingStrategy {
  readonly signature = '<tool'; // Generic signature, ToolParsingState will select it.
  
  private internalState: FwState = FwState.AWAITING_ARGUMENTS_OPEN;
  private fullToolBuffer: string = '';
  private scanBuffer: string = '';
  private contentBuffer: string = '';
  private currentArgName: 'path' | 'content' | null = null;
  private args: { path?: string, content?: string } = {};

  checkSignature(buffer: string): SignatureMatch {
    // This strategy is selected by name, not signature, so this is nominal.
    if (buffer.startsWith(this.signature)) {
      return 'match';
    }
    return 'no_match';
  }

  startSegment(context: ParserContext, signatureBuffer: string): void {
    this.fullToolBuffer = signatureBuffer;
    context.startXmlToolCallSegment('FileWriter');
    context.appendToCurrentToolRawContent(signatureBuffer);
  }

  processChar(char: string, context: ParserContext): void {
    this.fullToolBuffer += char;
    context.appendToCurrentToolRawContent(char);
    
    switch (this.internalState) {
      case FwState.AWAITING_ARGUMENTS_OPEN:
        this.runSeekTag(char, '<arguments>', FwState.INSIDE_ARGUMENTS);
        break;
      case FwState.INSIDE_ARGUMENTS:
        this.runInsideArguments(char);
        break;
      case FwState.STREAMING_ARG_CONTENT:
        this.runStreamingContent(char, context);
        break;
      case FwState.AWAITING_TOOL_CLOSE:
        this.runSeekTag(char, '</tool>', FwState.COMPLETE);
        break;
    }
  }

  finalize(context: ParserContext): void {
    if (this.isComplete() && this.internalState !== FwState.INVALID) {
      context.updateCurrentToolArguments(this.args);
      context.endCurrentToolSegment();
    } else {
      // Revert to text
      const parsingSegmentIndex = context.segments.findIndex(s => s === context.currentSegment);
      if (parsingSegmentIndex !== -1) {
          context.segments.splice(parsingSegmentIndex, 1);
      }
      context.appendTextSegment(this.fullToolBuffer);
    }
  }

  isComplete(): boolean {
    return this.internalState === FwState.COMPLETE || this.internalState === FwState.INVALID;
  }

  private setState(newState: FwState): void {
    if (this.internalState !== newState) {
        this.internalState = newState;
        this.scanBuffer = '';
    }
  }

  private runSeekTag(char: string, targetTag: string, nextState: FwState): void {
    if (!this.scanBuffer.length && /\s/.test(char)) return; // Skip leading whitespace

    this.scanBuffer += char;
    if (this.scanBuffer.toLowerCase() === targetTag) {
        this.setState(nextState);
    } else if (!targetTag.startsWith(this.scanBuffer.toLowerCase())) {
        this.setState(FwState.INVALID);
    }
  }

  private runInsideArguments(char: string): void {
    if (this.scanBuffer.length > 0) { // We are currently scanning a tag
        this.scanBuffer += char;
        const lowerBuffer = this.scanBuffer.toLowerCase();

        if (char === '>') { // Tag finished, process it
            this.scanBuffer = ''; // Clear buffer for next tag
            if (lowerBuffer === '</arguments>') {
                this.setState(FwState.AWAITING_TOOL_CLOSE);
                return;
            }

            const pathMatch = /<arg\s+name=["']path["']>/.exec(lowerBuffer);
            const contentMatch = /<arg\s+name=["']content["']>/.exec(lowerBuffer);

            if (pathMatch) {
                this.currentArgName = 'path';
                this.setState(FwState.STREAMING_ARG_CONTENT);
            } else if (contentMatch) {
                this.currentArgName = 'content';
                this.setState(FwState.STREAMING_ARG_CONTENT);
            } else {
                this.setState(FwState.INVALID);
            }
        } else { // Still scanning tag, check if it's still a valid prefix
            const couldBeArg = lowerBuffer.startsWith('<arg') || '<arg'.startsWith(lowerBuffer);
            const couldBeClosing = '</arguments>'.startsWith(lowerBuffer);
            if (!couldBeArg && !couldBeClosing) {
                this.setState(FwState.INVALID);
            }
        }
    } else { // We are between tags, looking for a new tag start
        if (char === '<') {
            this.scanBuffer = '<'; // Start scanning a new tag
        } else if (!/\s/.test(char)) {
            // Non-whitespace text directly inside <arguments> is invalid
            this.setState(FwState.INVALID);
        }
    }
  }

  private runStreamingContent(char: string, context: ParserContext): void {
    this.contentBuffer += char;
    const terminator = '</arg>';
    
    if (this.contentBuffer.toLowerCase().endsWith(terminator)) {
        const finalContent = this.contentBuffer.slice(0, -terminator.length);
        
        if (this.currentArgName) {
            // Crucial logic: Only decode entities for non-content arguments.
            const processedContent = (this.currentArgName === 'content') ? finalContent : decodeEntities(finalContent);
            this.args[this.currentArgName] = processedContent;
            context.updateCurrentToolArguments(this.args);
        }
        
        this.contentBuffer = '';
        this.currentArgName = null;
        this.setState(FwState.INSIDE_ARGUMENTS);
    } else {
        if(this.currentArgName) {
            // Crucial logic: Only decode entities for non-content arguments.
            const processedContent = (this.currentArgName === 'content') ? this.contentBuffer : decodeEntities(this.contentBuffer);
            this.args[this.currentArgName] = processedContent;
            context.updateCurrentToolArguments(this.args);
        }
    }
  }
}
