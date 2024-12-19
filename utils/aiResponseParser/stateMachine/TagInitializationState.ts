import { BaseState, ParserStateType } from './State';
import { TagParsingState } from './TagParsingState';
import { TextState } from './TextState';
import { ParserContext } from './ParserContext';

export class TagInitializationState extends BaseState {
  stateType = ParserStateType.TAG_INITIALIZATION_STATE;
  private readonly possibleBash = '<bash';
  private readonly possibleFile = '<file';

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

      if (couldBeBash || couldBeFile) {
        if (tagBuffer === '<bash' || tagBuffer === '<file') {
          this.context.transitionTo(new TagParsingState(this.context));
          return;
        }
        // partial match, continue
      } else {
        // not a recognized tag start, revert to text
        this.context.appendTextSegment(tagBuffer);
        this.context.tagBuffer = '';
        this.context.transitionTo(new TextState(this.context));
        return;
      }
    }
  }
}