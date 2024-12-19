import { BaseState, ParserStateType } from './State';
import { TagInitializationState } from './TagInitializationState';
import { ParserContext } from './ParserContext';

export class TextState extends BaseState {
  stateType = ParserStateType.TEXT_STATE;

  constructor(context: ParserContext) {
    super(context);
  }

  run(): void {
    while (this.context.hasMoreChars()) {
      const char = this.context.peekChar()!;
      if (char === '<') {
        this.context.advance();
        this.context.tagBuffer = '<';
        this.context.transitionTo(new TagInitializationState(this.context));
        return;
      } else {
        this.context.appendTextSegment(char);
        this.context.advance();
      }
    }
  }
}