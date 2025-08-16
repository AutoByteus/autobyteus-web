import { BaseState, ParserStateType } from './State';
import { XmlTagInitializationState } from './XmlTagInitializationState';
import { JsonInitializationState } from './JsonInitializationState';
import { ParserContext } from './ParserContext';

export class TextState extends BaseState {
  stateType = ParserStateType.TEXT_STATE;

  constructor(context: ParserContext) {
    super(context);
  }

  run(): void {
    const startPos = this.context.getPosition();

    while (this.context.hasMoreChars()) {
      const char = this.context.peekChar();

      if (char === '<' || char === '{' || char === '[') {
        const text = this.context.substring(startPos, this.context.getPosition());
        this.context.appendTextSegment(text);
        
        // The current position is on the boundary character. The next state
        // is responsible for consuming it. We just transition.
        if (char === '<') {
          this.context.transitionTo(new XmlTagInitializationState(this.context));
        } else { // '{' or '['
          this.context.transitionTo(new JsonInitializationState(this.context));
        }
        return;
      }
      
      this.context.advance();
    }

    // If loop completes, the rest of the buffer is text
    const text = this.context.substring(startPos);
    if (text) {
      this.context.appendTextSegment(text);
    }
  }
}
