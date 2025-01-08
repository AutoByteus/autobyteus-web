
import type { AIResponseSegment } from '~/utils/aiResponseParser/types';
import { IncrementalAIResponseParser } from '~/utils/aiResponseParser/incrementalAIResponseParser';

export interface ContextFilePath {
  path: string;
  type: string;
}

export interface BaseMessage {
  text: string;
  timestamp: Date;  // We'll keep the timestamp field if we still want it for internal tracking,
                    // but we won't display it anymore in the UI.
}

export interface UserMessage extends BaseMessage {
  type: 'user';
  contextFilePaths?: ContextFilePath[];
  // Token usage fields for user messages
  promptTokens?: number;
  promptCost?: number;
}

export interface AIMessage extends BaseMessage {
  type: 'ai';
  chunks?: string[];
  segments?: AIResponseSegment[];
  isComplete?: boolean;
  parserInstance?: IncrementalAIResponseParser;
  // Token usage fields for AI messages
  completionTokens?: number;
  completionCost?: number;
}

export type Message = UserMessage | AIMessage;

export interface Conversation {
  id: string;
  stepId: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}
