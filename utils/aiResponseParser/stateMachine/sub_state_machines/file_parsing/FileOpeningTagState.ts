/* autobyteus-web/utils/aiResponseParser/stateMachine/sub_state_machines/file_parsing/FileOpeningTagState.ts */
import type { ParserContext } from '../../ParserContext';
import type { IFileSubState } from './types';
import { FileContentState } from './FileContentState';

export class FileOpeningTagState implements IFileSubState {
  private openingTagBuffer: string = '';

  /**
   * Manually parses the path attribute from the buffered tag string.
   * This is more robust than a regex and avoids potential engine quirks.
   * @param tag - The buffered tag string, e.g., ' path="a.txt"'
   * @returns The path string if found, otherwise null.
   */
  private parsePath(tag: string): string | null {
    // Regex to find 'path' attribute. The \s ensures it's preceded by whitespace,
    // preventing a match inside other attributes like 'not_a_path'.
    // It captures the quote type and uses a backreference \1 to match the closing quote,
    // correctly handling both single and double-quoted values.
    const pathMatch = tag.match(/\spath=(["'])(.*?)\1/);
    // The path is in the second capture group (index 2)
    if (pathMatch && pathMatch[2] !== undefined) {
      return pathMatch[2];
    }
    return null;
  }

  run(context: ParserContext): IFileSubState | null {
    while (context.hasMoreChars()) {
      const char = context.peekChar()!;
      this.openingTagBuffer += char;
      context.advance();

      if (char === '>') {
        const path = this.parsePath(this.openingTagBuffer);
        
        if (path) {
          context.startFileSegment(path);
          // Transition to the next state in the sub-machine
          return new FileContentState();
        } else {
          // Malformed tag, invalidate by returning null
          return null;
        }
      }
    }
    // Need more characters
    return this;
  }

  getFinalBuffer(): string {
    // This is called if the state invalidates.
    // Prepend the part that the main FSM consumed.
    return '<file' + this.openingTagBuffer;
  }
}
