import { BaseState, ParserStateType } from './State';
import { FileParsingState } from './FileParsingState';
import { IframeParsingState } from './IframeParsingState';
import { ToolParsingState } from './ToolParsingState';
import { TextState } from './TextState';
import { ParserContext } from './ParserContext';
import { XmlToolParsingStrategy } from '../tool_parsing_strategies/xmlToolParsingStrategy';

export class XmlTagInitializationState extends BaseState {
  stateType = ParserStateType.XML_TAG_INITIALIZATION_STATE;
  private readonly possibleFile = '<file';
  private readonly possibleTool = '<tool';
  private readonly possibleDoctype = '<!doctype html>'; // Case-insensitive check target
  private tagBuffer: string = '';

  constructor(context: ParserContext) {
    super(context);
    // The TextState found a '<' but did not consume it.
    // Per the "Cursor Rule", this state consumes the '<' it was created for.
    this.context.advance();
    this.tagBuffer = '<';
  }

  run(): void {
    const { strategy } = this.context;

    while (this.context.hasMoreChars()) {
      const char = this.context.peekChar()!;
      this.tagBuffer += char;
      this.context.advance();

      const lowerCaseBuffer = this.tagBuffer.toLowerCase();
      
      // --- Immediate transition for exact short-circuit matches ---
      if (lowerCaseBuffer === '<file') {
        this.context.transitionTo(new FileParsingState(this.context));
        return;
      }
      if (lowerCaseBuffer === this.possibleDoctype) {
        this.context.transitionTo(new IframeParsingState(this.context, this.tagBuffer));
        return;
      }

      // --- Tag completion check ---
      if (char === '>') {
        if ((strategy instanceof XmlToolParsingStrategy) && lowerCaseBuffer.startsWith(this.possibleTool)) {
            if (this.context.parseToolCalls) {
                // Rewind before transitioning so ToolParsingState can re-parse the tag and select the right strategy.
                this.context.setPosition(this.context.getPosition() - this.tagBuffer.length);
                this.context.transitionTo(new ToolParsingState(this.context, this.tagBuffer));
            } else {
                this.context.appendTextSegment(this.tagBuffer);
                this.context.transitionTo(new TextState(this.context));
            }
        } else {
            this.context.appendTextSegment(this.tagBuffer);
            this.context.transitionTo(new TextState(this.context));
        }
        return;
      }

      // --- Continuity check ---
      const couldBeFile = this.possibleFile.startsWith(lowerCaseBuffer);
      const couldBeTool = (strategy instanceof XmlToolParsingStrategy) && (this.possibleTool.startsWith(lowerCaseBuffer) || lowerCaseBuffer.startsWith(this.possibleTool));
      const couldBeDoctype = this.possibleDoctype.startsWith(lowerCaseBuffer);

      if (!couldBeFile && !couldBeTool && !couldBeDoctype) {
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
