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
    const buffer = this.context.buffer;
    let currentPos = this.context.pos;

    while (currentPos < buffer.length) {
      const char = buffer[currentPos];

      // Simplified: Only trigger on '<' for XML or '{' for JSON.
      if (char === '<' || char === '{') {
        const text = buffer.substring(this.context.pos, currentPos);
        this.context.appendTextSegment(text);
        
        // Set the context position TO the boundary character, but DON'T consume it.
        // The next state is responsible for consuming its own signature.
        this.context.pos = currentPos;

        if (char === '<') {
          this.context.transitionTo(new XmlTagInitializationState(this.context));
        } else { // '{'
          this.context.transitionTo(new JsonInitializationState(this.context));
        }
        return;
      }
      
      currentPos++;
    }

    // If loop completes, the rest of the buffer is text
    const text = buffer.substring(this.context.pos);
    if (text) {
      this.context.appendTextSegment(text);
      this.context.pos = buffer.length;
    }
  }
}
