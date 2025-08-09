/* autobyteus-web/utils/aiResponseParser/stateMachine/FileParsingStateMachine.ts */
import type { ParserContext } from './ParserContext';

enum InternalFileState {
  PARSING_OPENING_TAG,
  READING_CONTENT,
  SCANNING_CLOSING_TAG_START,
  SCANNING_CLOSING_TAG_BODY,
  COMPLETE,
  INVALID,
}

/**
 * A self-contained state machine responsible for the entire lifecycle of parsing a <file> block.
 * It is instantiated and driven by the main `FileParsingState`.
 * This class encapsulates all the logic that was previously spread across
 * FileOpeningTagParsingState, FileContentReadingState, and FileClosingTagScanState.
 */
export class FileParsingStateMachine {
  private internalState: InternalFileState = InternalFileState.PARSING_OPENING_TAG;
  private openingTagBuffer: string = '';
  private closingTagBuffer: string = '';
  private readonly closingTag = '</file>';

  constructor(private context: ParserContext) {}

  public run(): void {
    while (this.context.hasMoreChars() && !this.isComplete()) {
      switch (this.internalState) {
        case InternalFileState.PARSING_OPENING_TAG:
          this.runParseOpeningTag();
          break;
        case InternalFileState.READING_CONTENT:
          this.runReadContent();
          break;
        case InternalFileState.SCANNING_CLOSING_TAG_START:
          this.runScanClosingTagStart();
          break;
        case InternalFileState.SCANNING_CLOSING_TAG_BODY:
          this.runScanClosingTagBody();
          break;
      }
    }
  }

  public isComplete(): boolean {
    return this.internalState === InternalFileState.COMPLETE || this.internalState === InternalFileState.INVALID;
  }

  public wasSuccessful(): boolean {
    return this.internalState === InternalFileState.COMPLETE;
  }
  
  public getFinalTagBuffer(): string {
      // If we invalidated, the buffer contains the text to revert to.
      // We prepend '<file' because that was consumed by XmlTagInitializationState.
      return '<file' + this.openingTagBuffer;
  }

  private runParseOpeningTag(): void {
    const char = this.context.peekChar()!;
    this.openingTagBuffer += char;
    this.context.advance();

    if (char === '>') {
      const pathMatch = this.openingTagBuffer.match(/path=['"]([^'"]+)['"]/);
      if (pathMatch && pathMatch[1]) {
        this.context.startFileSegment(pathMatch[1]);
        this.internalState = InternalFileState.READING_CONTENT;
        // Skip potential first newline
        if (this.context.peekChar() === '\n') {
          this.context.advance();
        }
      } else {
        // Malformed tag, invalidate.
        this.internalState = InternalFileState.INVALID;
      }
    }
  }

  private runReadContent(): void {
    const char = this.context.peekChar()!;
    if (char === '<') {
      this.internalState = InternalFileState.SCANNING_CLOSING_TAG_START;
    } else {
      this.context.appendToFileSegment(char);
      this.context.advance();
    }
  }

  private runScanClosingTagStart(): void {
    const char = this.context.peekChar()!;
    if (char === '<') {
      this.closingTagBuffer = '<';
      this.context.advance();
      this.internalState = InternalFileState.SCANNING_CLOSING_TAG_BODY;
    } else {
      // False alarm, it wasn't a tag. Go back to reading content.
      this.internalState = InternalFileState.READING_CONTENT;
    }
  }

  private runScanClosingTagBody(): void {
    const char = this.context.peekChar()!;
    this.closingTagBuffer += char;
    this.context.advance();

    if (this.closingTag.startsWith(this.closingTagBuffer)) {
      if (this.closingTagBuffer === this.closingTag) {
        // Success! We found the closing tag.
        this.context.endFileSegment();
        this.internalState = InternalFileState.COMPLETE;
      }
      // Otherwise, it's a partial match, so we continue.
    } else {
      // It's not the closing tag. Revert the buffer and go back to reading content.
      this.context.appendToFileSegment(this.closingTagBuffer);
      this.closingTagBuffer = '';
      this.internalState = InternalFileState.READING_CONTENT;
    }
  }
}
