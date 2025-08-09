/* autobyteus-web/utils/aiResponseParser/stateMachine/FileParsingState.ts */
import { BaseState, ParserStateType } from './State';
import { TextState } from './TextState';
import { FileParsingStateMachine } from './FileParsingStateMachine';
import type { ParserContext } from './ParserContext';

/**
 * A state in the main state machine that delegates the work of parsing a <file> block
 * to a dedicated, self-contained FileParsingStateMachine.
 * This follows the Composite State design pattern.
 */
export class FileParsingState extends BaseState {
  stateType = ParserStateType.FILE_PARSING_STATE;
  private fileStateMachine: FileParsingStateMachine;

  constructor(context: ParserContext) {
    super(context);
    this.fileStateMachine = new FileParsingStateMachine(this.context);
  }

  run(): void {
    // Run the sub-state machine until it's done or needs more data.
    this.fileStateMachine.run();

    if (this.fileStateMachine.isComplete()) {
      if (!this.fileStateMachine.wasSuccessful()) {
        // The file tag was malformed. Revert the buffered tag content to a text segment.
        const revertedText = this.fileStateMachine.getFinalTagBuffer();
        this.context.appendTextSegment(revertedText);
      }
      // Whether successful or not, transition back to TextState to continue parsing.
      this.context.transitionTo(new TextState(this.context));
    }
  }

  finalize(): void {
    // If the stream ends mid-file, we just leave the partial file segment as-is.
    // The FileParsingStateMachine doesn't have a complex finalization logic, as any
    // content it has processed has already been appended to the current file segment.
  }
}
