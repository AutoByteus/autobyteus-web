/* autobyteus-web/utils/aiResponseParser/stateMachine/ThinkContentReadingState.ts */
import { BaseState, ParserStateType } from './State';
import { ThinkClosingTagScanState } from './ThinkClosingTagScanState';
import { ParserContext } from './ParserContext';

export class ThinkContentReadingState extends BaseState {
  stateType = ParserStateType.THINK_CONTENT_READING_STATE;

  constructor(context: ParserContext) {
    super(context);
  }

  run(): void {
    // Optional: Skip an initial newline to avoid an empty first line
    if (this.context.hasMoreChars()) {
      const firstChar = this.context.peekChar()!;
      if (firstChar === '\n') {
        this.context.advance();
      }
    }
    while (this.context.hasMoreChars()) {
      const char = this.context.peekChar()!;
      if (char === '<') {
        this.context.advance();
        // Initialize the think closing buffer with '<'        
        this.context.thinkClosingBuffer = '<';
        this.context.transitionTo(new ThinkClosingTagScanState(this.context));
        return;
      } else {
        this.context.appendToThinkSegment(char);
        this.context.advance();
      }
    }
  }
}
