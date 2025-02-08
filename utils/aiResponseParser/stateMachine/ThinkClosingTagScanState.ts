import { BaseState, ParserStateType } from './State';
import { ThinkContentReadingState } from './ThinkContentReadingState';
import { TextState } from './TextState';
import { ParserContext } from './ParserContext';

export class ThinkClosingTagScanState extends BaseState {
  stateType = ParserStateType.THINK_CLOSING_TAG_SCAN_STATE;
  // Updated the closing tag to the new value
  private readonly closingTag = '</llm_reasoning_token>';

  constructor(context: ParserContext) {
    super(context);
  }

  run(): void {
    while (this.context.hasMoreChars()) {
      const char = this.context.peekChar()!;
      this.context.thinkClosingBuffer += char;
      this.context.advance();

      const { thinkClosingBuffer } = this.context;
      if (this.closingTag.startsWith(thinkClosingBuffer)) {
        if (thinkClosingBuffer === this.closingTag) {
          this.context.endThinkSegment();
          this.context.thinkClosingBuffer = '';
          this.context.transitionTo(new TextState(this.context));
          return;
        }
      } else {
        // Not a closing tag; append the buffer to the current think segment
        for (const c of thinkClosingBuffer) {
          this.context.appendToThinkSegment(c);
        }
        this.context.thinkClosingBuffer = '';
        this.context.transitionTo(new ThinkContentReadingState(this.context));
        return;
      }
    }
  }
}