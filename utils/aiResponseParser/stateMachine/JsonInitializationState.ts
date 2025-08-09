import { BaseState, ParserStateType } from './State';
import { ToolParsingState } from './ToolParsingState';
import { TextState } from './TextState';
import { ParserContext } from './ParserContext';

export class JsonInitializationState extends BaseState {
  stateType = ParserStateType.JSON_INITIALIZATION_STATE;
  private signatureBuffer: string = '';

  constructor(context: ParserContext) {
    super(context);
    // The TextState found a '{' but did not consume it.
    // Per the "Cursor Rule", this state consumes the trigger it was created for.
    const triggerChar = this.context.peekChar()!;
    this.context.advance();
    this.signatureBuffer = triggerChar;
  }

  run(): void {
    // FIX: If tool parsing is disabled, treat the trigger char as text and immediately revert.
    if (!this.context.parseToolCalls) {
      this.context.appendTextSegment(this.signatureBuffer);
      this.context.transitionTo(new TextState(this.context));
      return;
    }

    while (this.context.hasMoreChars()) {
      const char = this.context.peekChar()!;
      this.signatureBuffer += char;
      this.context.advance();
      
      const match = this.context.strategy.checkSignature(this.signatureBuffer);

      if (match === 'match') {
        // We found a match. The signature buffer now contains the full signature.
        // We must rewind the position so the ToolParsingState can start fresh
        // from the beginning of the signature.
        this.context.setPosition(this.context.getPosition() - this.signatureBuffer.length);
        this.context.transitionTo(new ToolParsingState(this.context, this.signatureBuffer));
        return;
      }
      
      if (match === 'no_match') {
        // It's definitely not a tool. Revert to text.
        this.context.appendTextSegment(this.signatureBuffer);
        this.context.transitionTo(new TextState(this.context));
        return;
      }

      // if 'partial', we continue the loop to get more characters.
    }
  }

  override finalize(): void {
      if (this.signatureBuffer) {
          this.context.appendTextSegment(this.signatureBuffer);
          this.signatureBuffer = '';
      }
      this.context.transitionTo(new TextState(this.context));
  }
}
