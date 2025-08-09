/* autobyteus-web/utils/aiResponseParser/stateMachine/sub_state_machines/file_parsing/FileClosingTagState.ts */
import type { ParserContext } from '../../ParserContext';
import type { IFileSubState } from './types';
import { FileContentState } from './FileContentState';

export class FileClosingTagState implements IFileSubState {
  private closingTagBuffer: string = '';
  private readonly closingTag = '</file>';

  run(context: ParserContext): IFileSubState | null {
    // The previous state saw a '<' but didn't consume it. We consume it now.
    if (this.closingTagBuffer === '') {
      this.closingTagBuffer = context.peekChar()!;
      context.advance();
    }
    
    while (context.hasMoreChars()) {
      const char = context.peekChar()!;
      this.closingTagBuffer += char;
      context.advance();

      if (this.closingTag.startsWith(this.closingTagBuffer)) {
        if (this.closingTagBuffer === this.closingTag) {
          // Success! End the sub-machine by returning null.
          context.endFileSegment();
          return null; 
        }
        // else, partial match, continue scanning.
      } else {
        // Not the closing tag. Revert the buffer and immediately delegate
        // the rest of the stream processing to the FileContentState.
        context.appendToFileSegment(this.closingTagBuffer);
        const contentState = new FileContentState();
        return contentState.run(context);
      }
    }
    // Need more characters
    return this;
  }
  
  getFinalBuffer(): string { return this.closingTagBuffer; }
}
