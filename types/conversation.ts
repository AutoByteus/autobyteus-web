import type { IncrementalAIResponseParser } from '~/utils/aiResponseParser/incrementalAIResponseParser';
import type { AIResponseSegment } from '~/utils/aiResponseParser/types';
import type { ContextFileType } from '~/generated/graphql';

export interface ContextFilePath {
  path: string;
  type: keyof typeof ContextFileType;
}

export interface Message {
  type: 'user' | 'ai';
  timestamp: Date;
}

export interface UserMessage extends Message {
  type: 'user';
  text: string;
  contextFilePaths?: ContextFilePath[];
  promptTokens?: number;
  promptCost?: number;
}

export interface AIMessage extends Message {
  type: 'ai';
  text: string;
  chunks: string[];
  segments: AIResponseSegment[];
  isComplete: boolean;
  parserInstance: IncrementalAIResponseParser;
  completionTokens?: number;
  completionCost?: number;
}

export interface Conversation {
  id: string; // This will be agentId after the first message
  messages: (UserMessage | AIMessage)[];
  createdAt: string;
  updatedAt: string;
  // This is used for sending the first message to create a new agent instance.
  agentDefinitionId?: string;
  // This is set on the first turn and persists for the conversation.
  llmModelName?: string;
  // This is set on the first turn and persists for the conversation.
  useXmlToolFormat?: boolean;
  // This is set on the first turn and persists for the conversation.
  parseToolCalls?: boolean;
}
