import { BaseState, ParserStateType } from './State';
import { TextState } from './TextState';
import type { ParserContext } from './ParserContext';

enum InternalState {
  EXPECTING_HTML_TAG,
  STREAMING_CONTENT,
}

export class IframeParsingState extends BaseState {
  stateType = ParserStateType.IFRAME_PARSING_STATE;
  private internalState: InternalState = InternalState.EXPECTING_HTML_TAG;
  private tempBuffer: string = '';
  private readonly closingTag = '</html>';
  private segmentStarted: boolean = false;

  constructor(context: ParserContext, doctypeDeclaration: string) {
    super(context);
    this.tempBuffer = doctypeDeclaration;
  }

  run(): void {
    while (this.context.hasMoreChars()) {
      const char = this.context.peekChar()!;
      const advanceAndContinue = () => {
        this.context.advance();
        return;
      };

      if (this.internalState === InternalState.EXPECTING_HTML_TAG) {
        this.tempBuffer += char;
        const trimmedBuffer = this.tempBuffer.toLowerCase().replace(/\s/g, '');
        
        if (trimmedBuffer.includes('<html')) {
          if (char === '>') {
            this.context.startIframeSegment(this.tempBuffer);
            this.segmentStarted = true;
            this.internalState = InternalState.STREAMING_CONTENT;
            this.tempBuffer = ''; // Clear buffer as it's now in the segment
          }
        }
        advanceAndContinue();
        continue;
      } 
      
      if (this.internalState === InternalState.STREAMING_CONTENT) {
        this.context.appendToIframeSegmentContent(char);
        this.tempBuffer += char; // Also keep a small look-behind buffer
        
        if (this.tempBuffer.length > this.closingTag.length) {
            this.tempBuffer = this.tempBuffer.substring(1);
        }

        if (this.tempBuffer.toLowerCase().endsWith(this.closingTag)) {
          this.context.endIframeSegment();
          this.context.transitionTo(new TextState(this.context));
          this.context.advance();
          return;
        }
        advanceAndContinue();
      }
    }
  }

  finalize(): void {
    if (!this.segmentStarted) {
      // If we never even started the iframe segment, revert the doctype to text.
      this.context.appendTextSegment(this.tempBuffer);
    }
    // If the stream ends mid-content, we simply do nothing.
    // The segment remains with isComplete: false, which is the desired outcome.
    this.context.transitionTo(new TextState(this.context));
  }
}
