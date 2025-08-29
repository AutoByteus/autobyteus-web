import { BaseState, ParserStateType } from './State';
import { ToolParsingState } from './ToolParsingState';
import { TextState } from './TextState';
import { ParserContext } from './ParserContext';

export class JsonInitializationState extends BaseState {
  stateType = ParserStateType.JSON_INITIALIZATION_STATE;
  private signatureBuffer: string = '';

  constructor(context: ParserContext) {
    super(context);
    // The TextState found a '{' or '[' but did not consume it.
    // Per the "Cursor Rule", this state consumes the trigger it was created for.
    const triggerChar = this.context.peekChar()!;
    this.context.advance();
    this.signatureBuffer = triggerChar;
  }

  run(): void {
    // This state determines if a JSON-like block is a tool call.
    // It must respect the `parseToolCalls` flag from the context, just as its
    // sibling XmlTagInitializationState does.

    while (this.context.hasMoreChars()) {
      const char = this.context.peekChar()!;
      this.signatureBuffer += char;
      this.context.advance();
      
      const match = this.context.strategy.checkSignature(this.signatureBuffer);

      if (match === 'match') {
        // We found a potential tool signature. Now, check if we should parse it.
        if (this.context.parseToolCalls) {
          // It's a match and parsing is enabled. Hand off to the tool parser.
          // Rewind the position so ToolParsingState can consume the full signature.
          this.context.setPosition(this.context.getPosition() - this.signatureBuffer.length);
          this.context.transitionTo(new ToolParsingState(this.context, this.signatureBuffer));
        } else {
          // Parsing is disabled, so treat this as text and revert.
          this.context.appendTextSegment(this.signatureBuffer);
          this.context.transitionTo(new TextState(this.context));
        }
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
