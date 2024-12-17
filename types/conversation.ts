import type { AIResponseSegment } from '~/utils/aiResponseParser/types';
import { IncrementalAIResponseParser } from '~/utils/aiResponseParser/incrementalAIResponseParser';

export interface ContextFilePath {
  path: string;
  type: string;
}

export interface BaseMessage {
  text: string;
  timestamp: Date;
}

export interface UserMessage extends BaseMessage {
  type: 'user';
  contextFilePaths?: ContextFilePath[];
}

export interface AIMessage extends BaseMessage {
  type: 'ai';
  chunks?: string[];
  segments?: AIResponseSegment[];
  isComplete?: boolean;
  parserInstance?: IncrementalAIResponseParser;
}

export type Message = UserMessage | AIMessage;

export interface Conversation {
  id: string;
  stepId: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}