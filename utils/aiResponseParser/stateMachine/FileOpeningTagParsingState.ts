import { BaseState, ParserStateType } from './State';
import { TextState } from './TextState';
import { FileContentReadingState } from './FileContentReadingState';
import { ParserContext, FileParsingStatus } from './ParserContext';

export class FileOpeningTagParsingState extends BaseState {
  stateType = ParserStateType.FILE_OPENING_TAG_PARSING_STATE;

  constructor(context: ParserContext) {
    super(context);
  }

  run(): void {
    while (this.context.hasMoreChars()) {
      const char = this.context.peekChar()!;
      this.context.tagBuffer += char;
      this.context.advance();

      const { tagBuffer } = this.context;
      
      if (tagBuffer.startsWith('<file')) {
        if (this.handleStandardTag(tagBuffer, new FileContentReadingState(this.context), (tag) => {
          const pathMatch = tag.match(/path=['"]([^'"]+)['"]/);
          if (pathMatch) {
            this.context.startFileSegment(pathMatch[1]);
            // REFACTOR: Initialize the dedicated file parsing status object.
            this.context.fileParsingStatus = new FileParsingStatus();
            this.context.fileParsingStatus.nestingLevel = 1;
            return true;
          }
          return false;
        })) return;
      } else {
        if (this.isNoLongerPotentialTag(tagBuffer)) {
          this.context.appendTextSegment(tagBuffer);
          this.context.tagBuffer = '';
          this.context.transitionTo(new TextState(this.context));
          return;
        }
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

  private handleStandardTag(buffer: string, nextState: BaseState, onFound: (tag: string) => boolean): boolean {
      const gtIdx = buffer.indexOf('>');
      if (gtIdx !== -1) {
          const fullTag = buffer.slice(0, gtIdx + 1);
          if (onFound(fullTag)) {
              this.context.transitionTo(nextState);
          } else {
              // Tag was found but was malformed, treat as text
              this.context.appendTextSegment(fullTag);
              this.context.transitionTo(new TextState(this.context));
          }
          this.context.tagBuffer = '';
          return true;
      }
      return false;
  }

  private isNoLongerPotentialTag(buffer: string): boolean {
    const knownTags = ['<file'];
    return !knownTags.some(tag => tag.startsWith(buffer));
  }
}
