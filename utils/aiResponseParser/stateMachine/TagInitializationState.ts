import { BaseState, ParserStateType } from './State';
import { TagParsingState } from './TagParsingState';
import { ToolParsingState } from './ToolParsingState';
import { TextState } from './TextState';
import { ParserContext } from './ParserContext';
import { XmlStreamingStrategy } from '../streaming_strategies/xml_strategy';

export class TagInitializationState extends BaseState {
  stateType = ParserStateType.TAG_INITIALIZATION_STATE;
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
      const couldBeTool = (strategy instanceof XmlStreamingStrategy) && this.possibleTool.startsWith(tagBuffer);

      if (tagBuffer === '<file') {
        this.context.transitionTo(new TagParsingState(this.context));
        return;
      }
      
      if (tagBuffer === '<tool' && strategy instanceof XmlStreamingStrategy) {
        // Let ToolParsingState handle the buffer. We need to rewind the position
        // so it can read the full '<tool' signature.
        this.context.pos -= tagBuffer.length; 
        this.context.transitionTo(new ToolParsingState(this.context, tagBuffer));
        return;
      }

      if (!couldBeFile && !couldBeTool) {
        // Not a recognized tag. Revert to text.
        // The tag buffer contains the invalid tag start (e.g., '<unknown').
        // We append this as text and go back to TextState.
        this.context.appendTextSegment(tagBuffer);
        this.context.tagBuffer = '';
        this.context.transitionTo(new TextState(this.context));
        return;
      }
    }
  }
}
