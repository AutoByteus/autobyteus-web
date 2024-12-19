import { ParserContext } from './ParserContext';

export enum ParserStateType {
  TEXT_STATE = 'TEXT_STATE',
  TAG_INITIALIZATION_STATE = 'TAG_INITIALIZATION_STATE',
  TAG_PARSING_STATE = 'TAG_PARSING_STATE',
  FILE_CONTENT_READING_STATE = 'FILE_CONTENT_READING_STATE',
  FILE_CLOSING_TAG_SCAN_STATE = 'FILE_CLOSING_TAG_SCAN_STATE'
}

export interface State {
  readonly stateType: ParserStateType;
  run(): void;
}

export abstract class BaseState implements State {
  abstract stateType: ParserStateType;
  protected context: ParserContext;

  constructor(context: ParserContext) {
    this.context = context;
  }

  abstract run(): void;
}