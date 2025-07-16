import { BaseState, ParserStateType } from './State';
import { FileOpeningTagParsingState } from './FileOpeningTagParsingState';
import { ToolParsingState } from './ToolParsingState';
import { TextState } from './TextState';
import { ParserContext } from './ParserContext';
import { XmlToolParsingStrategy } from '../tool_parsing_strategies/xmlToolParsingStrategy';

export class XmlTagInitializationState extends BaseState {
  stateType = ParserStateType.XML_TAG_INITIALIZATION_STATE;
  private readonly possibleFile = '<file';
  private readonly possibleTool = '<tool';

  constructor(context: ParserContext) {
    super(context);
    // The TextState found a '<' but did not consume it.
    // Per the "Cursor Rule", this state consumes the '<' it was created for.
    this.context.advance();
    this.context.tagBuffer = '<';
  }

  run(): void {
    while (this.context.hasMoreChars()) {
      const char = this.context.peekChar()!;
      this.context.tagBuffer += char;
      this.context.advance();

      const { tagBuffer, strategy } = this.context;
      
      const couldBeFile = this.possibleFile.startsWith(tagBuffer);
      const couldBeTool = (strategy instanceof XmlToolParsingStrategy) && this.possibleTool.startsWith(tagBuffer);

      if (tagBuffer === '<file') {
        this.context.transitionTo(new FileOpeningTagParsingState(this.context));
        return;
      }
      
      if (tagBuffer === '<tool' && strategy instanceof XmlToolParsingStrategy) {
        // CORRECTED: Check the parseToolCalls flag HERE.
        if (this.context.parseToolCalls) {
          // We have a match. Rewind the buffer so the ToolParsingState can
          // consume the full signature from the start.
          this.context.pos -= tagBuffer.length;
          this.context.transitionTo(new ToolParsingState(this.context, tagBuffer));
        } else {
          // Parsing is disabled, so treat this as text and revert.
          this.context.appendTextSegment(tagBuffer);
          this.context.tagBuffer = '';
          this.context.transitionTo(new TextState(this.context));
        }
        return;
      }

      if (!couldBeFile && !couldBeTool) {
        // Not a recognized tag. Revert to text.
        this.context.appendTextSegment(tagBuffer);
        this.context.tagBuffer = '';
        this.context.transitionTo(new TextState(this.context));
        return;
      }
    }
  }

  finalize(): void {
      if (this.context.tagBuffer) {
          this.context.appendTextSegment(this.context.tagBuffer);
          this.context.tagBuffer = '';
      }
      this.context.transitionTo(new TextState(this.context));
  }
}
