/* autobyteus-web/utils/aiResponseParser/types.ts */

export interface ParsedFile {
  path: string;
  originalContent: string;
  highlightedContent?: string;
  language: string;
}

export interface AIResponseTextSegment {
  type: 'text';
  content: string;
}

export interface FileSegment {
  type: 'file';
  path: string;
  originalContent: string;
  highlightedContent?: string;
  language: string;
}

/* New ThinkSegment type for thinking content */
export interface ThinkSegment {
  type: 'think';
  content: string;
}

export interface ToolCallSegment {
  type: 'tool_call';
  invocationId: string;
  toolName: string;
  arguments: Record<string, any>;
  status: 'parsing' | 'parsed' | 'awaiting-approval' | 'executing' | 'success' | 'error' | 'denied';
  logs: string[];
  result: any | null;
  error: string | null;
  rawContent?: string; // Buffer for streaming raw content (JSON or XML)
}

// NEW BASH COMMAND SEGMENT TYPE
export interface BashCommandSegment {
  type: 'bash_command';
  command: string;
  description: string;
}

// NEW SEGMENT TYPE
export interface SystemTaskNotificationSegment {
  type: 'system_task_notification';
  senderId: string;
  content: string;
}

export interface InterAgentMessageSegment {
  type: 'inter_agent_message';
  senderAgentId: string;
  recipientRoleName: string;
  messageType: string;
  content: string;
}

// NEW MEDIA SEGMENT TYPE
export interface MediaSegment {
  type: 'media';
  mediaType: 'image' | 'audio' | 'video';
  urls: string[];
}

// IframeSegment TYPE with streaming support
export interface IframeSegment {
  type: 'iframe';
  content: string;
  isComplete: boolean; // Flag to control rendering (code vs. iframe)
}

export interface ErrorSegment{
  type: 'error';
  source: string;
  message: string;
  details?: string | null;
}

export type AIResponseSegment = 
  | AIResponseTextSegment 
  | FileSegment 
  | ThinkSegment
  | ToolCallSegment
  | BashCommandSegment
  | SystemTaskNotificationSegment
  | InterAgentMessageSegment
  | MediaSegment
  | IframeSegment
  | ErrorSegment;

export interface ParsedAIResponse {
  segments: AIResponseSegment[];
}
