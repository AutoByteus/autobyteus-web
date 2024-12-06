export interface ContextFilePath {
  path: string;
  type: 'text' | 'image';
}

export interface UserMessage {
  type: 'user';
  text: string;
  contextFilePaths: ContextFilePath[];
  timestamp: Date;
}

export interface AIMessage {
  type: 'ai';
  text: string;
  chunks?: string[];
  isComplete?: boolean;
  timestamp: Date;
}

export type Message = UserMessage | AIMessage;

export interface Conversation {
  id: string;
  stepId: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}