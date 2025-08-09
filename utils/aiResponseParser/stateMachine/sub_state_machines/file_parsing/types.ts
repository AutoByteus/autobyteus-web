/* autobyteus-web/utils/aiResponseParser/stateMachine/sub_state_machines/file_parsing/types.ts */
import type { ParserContext } from '../../ParserContext';

export interface IFileSubState {
  /**
   * Executes the logic for this part of the file parsing.
   * @returns The next state to transition to, 'this' to continue, or 'null' to terminate the sub-machine.
   */
  run(context: ParserContext): IFileSubState | null;

  /**
   * If the sub-machine terminates or invalidates, this gets any leftover buffer content.
   */
  getFinalBuffer(): string;
}
