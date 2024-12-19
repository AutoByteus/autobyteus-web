import { BaseState, ParserStateType } from './State';
import { TextState } from './TextState';
import { FileContentReadingState } from './FileContentReadingState';
import { ParserContext } from './ParserContext';

export class TagParsingState extends BaseState {
  stateType = ParserStateType.TAG_PARSING_STATE;

  constructor(context: ParserContext) {
    super(context);
  }

  run(): void {
    while (this.context.hasMoreChars()) {
      const char = this.context.peekChar()!;
      this.context.tagBuffer += char;
      this.context.advance();

      const { tagBuffer } = this.context;
      if (tagBuffer.startsWith('<bash')) {
        const closeIdx = tagBuffer.indexOf('/>');
        if (closeIdx !== -1) {
          const fullTag = tagBuffer.slice(0, closeIdx + 2);
          this.context.parseBashTag(fullTag);

          const leftover = tagBuffer.slice(closeIdx + 2);
          if (leftover.length > 0) {
            this.context.appendTextSegment(leftover);
          }
          this.context.tagBuffer = '';
          this.context.transitionTo(new TextState(this.context));
          return;
        }
      } else if (tagBuffer.startsWith('<file')) {
        const gtIdx = tagBuffer.indexOf('>');
        if (gtIdx !== -1) {
          const fileTag = tagBuffer.slice(0, gtIdx + 1);
          const pathMatch = fileTag.match(/path=['"]([^'"]+)['"]/);
          if (pathMatch) {
            this.context.startFileSegment(pathMatch[1]);
          }
          this.context.tagBuffer = '';
          this.context.transitionTo(new FileContentReadingState(this.context));
          return;
        }
      } else {
        // If it's no longer matching <bash or <file tag
        if (!('<bash'.startsWith(tagBuffer) || '<file'.startsWith(tagBuffer))) {
          this.context.appendTextSegment(tagBuffer);
          this.context.tagBuffer = '';
          this.context.transitionTo(new TextState(this.context));
          return;
        }
      }
    }
  }
}