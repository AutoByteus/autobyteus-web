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
  rawJsonContent?: string; // Buffer for streaming raw JSON
}

// NEW SEGMENT TYPE
export interface SystemTaskNotificationSegment {
  type: 'system_task_notification';
  senderId: string;
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
  | SystemTaskNotificationSegment
  | MediaSegment
  | IframeSegment
  | ErrorSegment;

export interface ParsedAIResponse {
  segments: AIResponseSegment[];
}
