import { BaseState, ParserStateType } from './State';
import { TagParsingState } from './TagParsingState';
import { TextState } from './TextState';
import { ParserContext } from './ParserContext';

export class TagInitializationState extends BaseState {
  stateType = ParserStateType.TAG_INITIALIZATION_STATE;
  private readonly possibleBash = '<bash';
  private readonly possibleFile = '<file';
  // Updated the thinking tag to the new value
  private readonly possibleThink = '<llm_reasoning_token';

  constructor(context: ParserContext) {
    super(context);
  }

  run(): void {
    while (this.context.hasMoreChars()) {
      const char = this.context.peekChar()!;
      this.context.tagBuffer += char;
      this.context.advance();

      const { tagBuffer } = this.context;
      const couldBeBash = this.possibleBash.startsWith(tagBuffer);
      const couldBeFile = this.possibleFile.startsWith(tagBuffer);
      const couldBeThink = this.possibleThink.startsWith(tagBuffer);

      if (couldBeBash || couldBeFile || couldBeThink) {
        // Check for complete match of one of the recognized tags
        if (tagBuffer === '<bash' || tagBuffer === '<file' || tagBuffer === '<llm_reasoning_token') {
          this.context.transitionTo(new TagParsingState(this.context));
          return;
        }
        // Partial match; continue reading characters
      } else {
        // Not a recognized tag; revert to text
        this.context.appendTextSegment(tagBuffer);
        this.context.tagBuffer = '';
        this.context.transitionTo(new TextState(this.context));
        return;
      }
    }
  }
}