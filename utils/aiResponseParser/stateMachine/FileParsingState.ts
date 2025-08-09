/* autobyteus-web/utils/aiResponseParser/stateMachine/FileParsingState.ts */
import { BaseState, ParserStateType } from './State';
import { TextState } from './TextState';
import type { IFileSubState } from './sub_state_machines/file_parsing/types';
import { FileOpeningTagState } from './sub_state_machines/file_parsing/FileOpeningTagState';
import type { ParserContext } from './ParserContext';

/**
 * A state in the main state machine that delegates the work of parsing a <file> block
 * to a dedicated, hierarchical sub-state-machine.
 * This follows the Composite State design pattern.
 */
export class FileParsingState extends BaseState {
  stateType = ParserStateType.FILE_PARSING_STATE;
  private currentSubState: IFileSubState | null;

  constructor(context: ParserContext) {
    super(context);
    // Initialize the sub-state-machine
    this.currentSubState = new FileOpeningTagState();
  }

  run(): void {
    while (this.currentSubState && this.context.hasMoreChars()) {
      this.currentSubState = this.currentSubState.run(this.context);
    }

    if (!this.currentSubState) {
      // The sub-machine has completed. Transition the main FSM back to TextState.
      this.context.transitionTo(new TextState(this.context));
    }
  }

  finalize(): void {
    // If the stream ends mid-file, we might have a partial buffer in the sub-state.
    if (this.currentSubState) {
        // This is a partial completion. We check if the sub-state was FileContentState,
        // in which case any parsed content is already in the segment.
        // If it was another sub-state (like closing tag scan), we might need to
        // revert its buffer to the last file segment.
        const leftoverBuffer = this.currentSubState.getFinalBuffer();
        if (leftoverBuffer) {
            this.context.appendToFileSegment(leftoverBuffer);
        }
    }
  }
}
