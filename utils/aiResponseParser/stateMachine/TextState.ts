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

      // Check for XML tag start, which is always active.
      if (char === '<') {
        const text = this.context.substring(startPos, this.context.getPosition());
        this.context.appendTextSegment(text);
        this.context.transitionTo(new XmlTagInitializationState(this.context));
        return;
      }
      
      // Conditionally check for JSON start characters only if parsing is enabled.
      if (this.context.parseToolCalls && !this.context.useXmlToolFormat && (char === '{' || char === '[')) {
        const text = this.context.substring(startPos, this.context.getPosition());
        this.context.appendTextSegment(text);
        this.context.transitionTo(new JsonInitializationState(this.context));
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
