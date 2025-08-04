import { BaseState, ParserStateType } from './State';
import { TextState } from './TextState';
import { FileContentReadingState } from './FileContentReadingState';
import { ParserContext } from './ParserContext';

export class FileClosingTagScanState extends BaseState {
  stateType = ParserStateType.FILE_CLOSING_TAG_SCAN_STATE;
  // This state is entered after a '<' is found inside a file.
  // The initial '<' is already in the fileClosingBuffer.

  constructor(context: ParserContext) {
    super(context);
  }

  run(): void {
    // FIX: The new logic buffers until a complete tag (ending in '>') is found,
    // then analyzes the complete tag. This is more robust than analyzing character-by-character.
    while (this.context.hasMoreChars()) {
      const char = this.context.peekChar()!;
      this.context.fileClosingBuffer += char;
      this.context.advance();

      if (char === '>') {
        // We have a complete tag in the buffer. Now we can analyze it.
        const fullTag = this.context.fileClosingBuffer;

        if (fullTag === '</file>') {
          // This is a closing tag. Handle nesting.
          this.context.fileParsingStatus!.nestingLevel--;
          if (this.context.fileParsingStatus!.nestingLevel === 0) {
            // Nesting level is 0, this is the final closing tag.
            this.context.endFileSegment();
            this.context.fileClosingBuffer = '';
            this.context.transitionTo(new TextState(this.context));
          } else {
            // Not the final closing tag, so treat it as content.
            this.context.appendToFileSegment(fullTag);
            this.context.fileClosingBuffer = '';
            this.context.transitionTo(new FileContentReadingState(this.context));
          }
        } else if (fullTag.startsWith('<file')) {
          // This is a nested opening tag. Increment nesting and treat as content.
          this.context.fileParsingStatus!.nestingLevel++;
          this.context.appendToFileSegment(fullTag);
          this.context.fileClosingBuffer = '';
          this.context.transitionTo(new FileContentReadingState(this.context));
        } else {
          // It's some other tag (e.g., <div>, <unknown>). Treat as content.
          this.context.appendToFileSegment(fullTag);
          this.context.fileClosingBuffer = '';
          this.context.transitionTo(new FileContentReadingState(this.context));
        }
        return; // We have handled the tag and transitioned.
      }
    }
    // If we run out of characters before finding '>', we remain in this state.
  }

  override finalize(): void {
      // If the stream ends while we're waiting for a '>', treat the buffer as text.
      if (this.context.fileClosingBuffer) {
        this.context.appendToFileSegment(this.context.fileClosingBuffer);
        this.context.fileClosingBuffer = '';
      }
      this.context.transitionTo(new FileContentReadingState(this.context));
  }
}
