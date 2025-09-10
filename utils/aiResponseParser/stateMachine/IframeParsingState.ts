import { BaseState, ParserStateType } from './State';
import { TextState } from './TextState';
import type { ParserContext } from './ParserContext';

enum InternalState {
  EXPECTING_HTML_TAG,
  READING_CONTENT,
}

export class IframeParsingState extends BaseState {
  stateType = ParserStateType.IFRAME_PARSING_STATE;
  private internalState: InternalState = InternalState.EXPECTING_HTML_TAG;
  private buffer: string = '';
  private readonly closingTag = '</html>';

  constructor(context: ParserContext, doctypeDeclaration: string) {
    super(context);
    // The previous state consumed the DOCTYPE. We hold onto it.
    this.buffer = doctypeDeclaration;
    // We no longer create the segment optimistically.
  }

  run(): void {
    while (this.context.hasMoreChars()) {
      const char = this.context.peekChar()!;
      this.buffer += char;
      this.context.advance();

      if (this.internalState === InternalState.EXPECTING_HTML_TAG) {
        // Trim whitespace and check for the start of the <html> tag.
        const trimmedBuffer = this.buffer.toLowerCase().replace(/\s/g, '');
        if (trimmedBuffer.includes('<html')) {
          // Once we find the start, we need to find the end of the opening tag.
          if (char === '>') {
            this.internalState = InternalState.READING_CONTENT;
          }
        }
      } else if (this.internalState === InternalState.READING_CONTENT) {
        // Check for the closing tag case-insensitively.
        if (this.buffer.toLowerCase().endsWith(this.closingTag)) {
          // Now that we have a complete document, create the segment in one go.
          this.context.addIframeSegment(this.buffer);
          this.context.transitionTo(new TextState(this.context));
          return;
        }
      }
    }
  }

  finalize(): void {
    // If the stream ends before we find </html>, it's not a complete document.
    // Revert the entire buffered content to a simple text segment.
    // Since no iframe segment was created, we don't need to clean anything up.
    this.context.appendTextSegment(this.buffer);
    this.context.transitionTo(new TextState(this.context));
  }
}
