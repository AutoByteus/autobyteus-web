/* autobyteus-web/utils/aiResponseParser/stateMachine/FileParsingStateMachine.ts */
import type { ParserContext } from './ParserContext';

enum InternalFileState {
  PARSING_OPENING_TAG,
  READING_CONTENT,
  // The SCANNING_TAG state handles potential nested <file> or closing </file> tags.
  SCANNING_TAG,
  COMPLETE,
  INVALID,
}

/**
 * A self-contained state machine responsible for the entire lifecycle of parsing a <file> block.
 * It is instantiated and driven by the main `FileParsingState`.
 * This class now supports nested <file> tags by using a nesting level counter.
 */
export class FileParsingStateMachine {
  private internalState: InternalFileState = InternalFileState.PARSING_OPENING_TAG;
  private openingTagBuffer: string = '';
  private tagScanBuffer: string = '';
  private nestingLevel: number = 1; // Start at 1 for the initial file tag.

  private readonly possibleOpeningFileTag = '<file';
  private readonly closingFileTag = '</file>';

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
        case InternalFileState.SCANNING_TAG:
          this.runScanTag();
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
      // The opening tag is now complete inside `openingTagBuffer`.
      // It includes attributes up to and including the closing '>'.
      // e.g., ' path="a.js">' or ' no_path="true">'
      const pathMatch = this.openingTagBuffer.match(/\s+path=['"]([^'"]+)['"]/);
      if (pathMatch && pathMatch[1]) {
        this.context.startFileSegment(pathMatch[1]);
        this.internalState = InternalFileState.READING_CONTENT;
        // Skip potential first newline
        if (this.context.peekChar() === '\n') {
          this.context.advance();
        }
      } else {
        // Malformed tag (missing or invalid path), invalidate.
        this.internalState = InternalFileState.INVALID;
      }
    }
  }

  private runReadContent(): void {
    const char = this.context.peekChar()!;
    if (char === '<') {
      this.internalState = InternalFileState.SCANNING_TAG;
      this.tagScanBuffer = '<';
      this.context.advance();
    } else {
      this.context.appendToFileSegment(char);
      this.context.advance();
    }
  }
  
  private runScanTag(): void {
    const char = this.context.peekChar()!;
    this.tagScanBuffer += char;
    this.context.advance();

    // Check for nested opening tag <file ... >
    if (this.tagScanBuffer.startsWith(this.possibleOpeningFileTag)) {
      // It *could* be an opening tag. Let's see if it's confirmed or invalidated.
      // A valid tag must be <file> or <file followed by a space.
      if (this.tagScanBuffer.length === this.possibleOpeningFileTag.length + 1) {
        const nextChar = this.tagScanBuffer[this.possibleOpeningFileTag.length];
        if (nextChar !== ' ' && nextChar !== '>') {
          // It's something like '<fileX', not a tag. Revert.
          this.context.appendToFileSegment(this.tagScanBuffer);
          this.tagScanBuffer = '';
          this.internalState = InternalFileState.READING_CONTENT;
          return;
        }
      }

      // If it's a valid potential start, keep scanning for '>'
      if (char === '>') {
        this.nestingLevel++;
        this.context.appendToFileSegment(this.tagScanBuffer);
        this.tagScanBuffer = '';
        this.internalState = InternalFileState.READING_CONTENT;
      }
      return; // Keep this return because we are inside what we believe is a valid tag.
    }

    // Check for closing tag </file>
    if (this.tagScanBuffer === this.closingFileTag) {
      this.nestingLevel--;
      if (this.nestingLevel === 0) {
        // This is the closing tag for our main file.
        this.context.endFileSegment();
        this.internalState = InternalFileState.COMPLETE;
      } else {
        // This is a closing tag for a nested file. Treat as text.
        this.context.appendToFileSegment(this.tagScanBuffer);
        this.tagScanBuffer = '';
        this.internalState = InternalFileState.READING_CONTENT;
      }
      return;
    }

    // If the buffer can no longer become a file or closing tag, revert to text.
    const couldBeOpening = this.possibleOpeningFileTag.startsWith(this.tagScanBuffer);
    const couldBeClosing = this.closingFileTag.startsWith(this.tagScanBuffer);

    if (!couldBeOpening && !couldBeClosing) {
      this.context.appendToFileSegment(this.tagScanBuffer);
      this.tagScanBuffer = '';
      this.internalState = InternalFileState.READING_CONTENT;
    }
    // Otherwise, it's a partial match of a known tag, so we continue scanning.
  }
}