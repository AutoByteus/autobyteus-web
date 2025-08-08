import { BaseState, ParserStateType } from './State';
import { TextState } from './TextState';
import { FileContentReadingState } from './FileContentReadingState';
import { ParserContext } from './ParserContext';

export class FileClosingTagScanState extends BaseState {
  stateType = ParserStateType.FILE_CLOSING_TAG_SCAN_STATE;
  private readonly closingTag = '</file>';

  constructor(context: ParserContext) {
    super(context);
  }

  run(): void {
    while (this.context.hasMoreChars()) {
      const char = this.context.peekChar()!;
      this.context.fileClosingBuffer += char;
      this.context.advance();

      const { fileClosingBuffer } = this.context;
      if (this.closingTag.startsWith(fileClosingBuffer)) {
        if (fileClosingBuffer === this.closingTag) {
          this.context.endFileSegment();
          this.context.fileClosingBuffer = '';
          this.context.transitionTo(new TextState(this.context));
          return;
        }
      } else {
        // not a closing tag, append what we have to the current file segment
        for (const c of fileClosingBuffer) {
          this.context.appendToFileSegment(c);
        }
        this.context.fileClosingBuffer = '';
        this.context.transitionTo(new FileContentReadingState(this.context));
        return;
      }
    }
  }

  override finalize(): void {
      if (this.context.fileClosingBuffer) {
          for (const c of this.context.fileClosingBuffer) {
            this.context.appendToFileSegment(c);
          }
          this.context.fileClosingBuffer = '';
      }
      this.context.transitionTo(new FileContentReadingState(this.context));
  }
}