import { BaseState, ParserStateType } from './State';
import { FileParsingState } from './FileParsingState';
import { ToolParsingState } from './ToolParsingState';
import { TextState } from './TextState';
import { ParserContext } from './ParserContext';
import { XmlToolParsingStrategy } from '../tool_parsing_strategies/xmlToolParsingStrategy';

export class XmlTagInitializationState extends BaseState {
  stateType = ParserStateType.XML_TAG_INITIALIZATION_STATE;
  private readonly possibleFile = '<file';
  private readonly possibleTool = '<tool';
  private tagBuffer: string = '';

  constructor(context: ParserContext) {
    super(context);
    // The TextState found a '<' but did not consume it.
    // Per the "Cursor Rule", this state consumes the '<' it was created for.
    this.context.advance();
    this.tagBuffer = '<';
  }

  run(): void {
    while (this.context.hasMoreChars()) {
      const char = this.context.peekChar()!;
      this.tagBuffer += char;
      this.context.advance();

      const { strategy } = this.context;
      
      const couldBeFile = this.possibleFile.startsWith(this.tagBuffer);
      const couldBeTool = (strategy instanceof XmlToolParsingStrategy) && this.possibleTool.startsWith(this.tagBuffer);

      if (this.tagBuffer === '<file') {
        this.context.transitionTo(new FileParsingState(this.context));
        return;
      }
      
      if (this.tagBuffer === '<tool' && strategy instanceof XmlToolParsingStrategy) {
        if (this.context.parseToolCalls) {
          // We have a match. Rewind the buffer so the ToolParsingState can
          // consume the full signature from the start.
          this.context.setPosition(this.context.getPosition() - this.tagBuffer.length);
          this.context.transitionTo(new ToolParsingState(this.context, this.tagBuffer));
        } else {
          // Parsing is disabled, so treat this as text and revert.
          this.context.appendTextSegment(this.tagBuffer);
          this.context.transitionTo(new TextState(this.context));
        }
        return;
      }

      if (!couldBeFile && !couldBeTool) {
        // Not a recognized tag. Revert to text.
        this.context.appendTextSegment(this.tagBuffer);
        this.context.transitionTo(new TextState(this.context));
        return;
      }
    }
  }

  finalize(): void {
      if (this.tagBuffer) {
          this.context.appendTextSegment(this.tagBuffer);
          this.tagBuffer = '';
      }
      this.context.transitionTo(new TextState(this.context));
  }
}
