/* autobyteus-web/utils/aiResponseParser/stateMachine/sub_state_machines/file_parsing/FileContentState.ts */
import type { ParserContext } from '../../ParserContext';
import type { IFileSubState } from './types';
import { FileClosingTagState } from './FileClosingTagState';

export class FileContentState implements IFileSubState {

  constructor() {
    // Skip the very first newline if present, preventing an empty first line
    // This is done once upon entering the state.
  }

  run(context: ParserContext): IFileSubState | null {
    if (context.peekChar() === '\n' && context.currentSegment?.type === 'file' && context.currentSegment.originalContent === '') {
        context.advance();
    }
    
    while (context.hasMoreChars()) {
      const char = context.peekChar()!;
      if (char === '<') {
        // Transition to closing tag scan
        return new FileClosingTagState();
      } else {
        context.appendToFileSegment(char);
        context.advance();
      }
    }
    // Need more characters
    return this;
  }
  
  getFinalBuffer(): string { return ''; }
}
