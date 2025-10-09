import { BaseState, ParserStateType } from './State';
import { TextState } from './TextState';
import type { ParserContext } from './ParserContext';

/**
 * Parses the content within a <bash>...</bash> block.
 */
export class BashParsingState extends BaseState {
  stateType = ParserStateType.BASH_PARSING_STATE;
  private contentBuffer: string = '';
  private readonly closingTag = '</bash>';
  private openingTag: string;

  constructor(context: ParserContext, openingTag: string) {
    super(context);
    this.openingTag = openingTag;
  }

  run(): void {
    while (this.context.hasMoreChars()) {
      const char = this.context.peekChar()!;
      this.contentBuffer += char;
      this.context.advance();

      // Case-insensitive check for the closing tag
      if (this.contentBuffer.toLowerCase().endsWith(this.closingTag)) {
        // We found the end. Finalize the segment.
        this.finalizeSegment(true);
        this.context.transitionTo(new TextState(this.context));
        return;
      }
    }
  }

  /**
   * Processes the collected content into a command and an optional description.
   * @param isComplete Indicates if the closing tag was found.
   */
  private finalizeSegment(isComplete: boolean): void {
    let finalContent = this.contentBuffer;
    if (isComplete) {
      // Remove the closing tag from the buffer
      finalContent = this.contentBuffer.slice(0, this.contentBuffer.length - this.closingTag.length);
    }

    let command = finalContent.trim();
    let description = '';

    const lines = command.split('\n');
    if (lines.length > 0 && lines[0].trim().startsWith('#')) {
      description = lines[0].trim().substring(1).trim();
      command = lines.slice(1).join('\n').trim();
    }
    
    // Only add a segment if there is a command to execute.
    if (command) {
        this.context.addBashCommandSegment(command, description);
    } else if (description && !command) {
        // If there's only a description comment but no command, treat it as text.
        this.context.appendTextSegment(finalContent);
    }
  }
  
  /**
   * If the stream ends before the closing tag, we treat the buffered content as text.
   */
  finalize(): void {
    // If the state is finalized without a closing tag, treat the content as text
    this.context.appendTextSegment(this.openingTag + this.contentBuffer);
    this.context.transitionTo(new TextState(this.context));
  }
}
