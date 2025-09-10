import { ParserContext } from './ParserContext';

export enum ParserStateType {
  TEXT_STATE = 'TEXT_STATE',
  XML_TAG_INITIALIZATION_STATE = 'XML_TAG_INITIALIZATION_STATE',
  JSON_INITIALIZATION_STATE = 'JSON_INITIALIZATION_STATE',
  FILE_PARSING_STATE = 'FILE_PARSING_STATE',
  IFRAME_PARSING_STATE = 'IFRAME_PARSING_STATE', // Renamed
  TOOL_PARSING_STATE = 'TOOL_PARSING_STATE', // Generic tool parsing state
}

export interface State {
  readonly stateType: ParserStateType;
  run(): void;
  finalize(): void;
}

export abstract class BaseState implements State {
  abstract stateType: ParserStateType;
  protected context: ParserContext;

  constructor(context: ParserContext) {
    this.context = context;
  }

  abstract run(): void;

  /**
   * Finalizes the state. Default implementation does nothing.
   * States that buffer data should override this to process any remaining data.
   */
  finalize(): void {
    // Default implementation does nothing.
  }
}
