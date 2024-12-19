import { BaseState, ParserStateType } from './State';
import { FileClosingTagScanState } from './FileClosingTagScanState';
import { ParserContext } from './ParserContext';

export class FileContentReadingState extends BaseState {
  stateType = ParserStateType.FILE_CONTENT_READING_STATE;

  constructor(context: ParserContext) {
    super(context);
  }

  run(): void {
    while (this.context.hasMoreChars()) {
      const char = this.context.peekChar()!;
      if (char === '<') {
        this.context.fileClosingBuffer = '<';
        this.context.advance();
        this.context.transitionTo(new FileClosingTagScanState(this.context));
        return;
      } else {
        this.context.appendToFileSegment(char);
        this.context.advance();
      }
    }
  }
}