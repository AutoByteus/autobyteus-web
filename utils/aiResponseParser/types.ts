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

export type AIResponseSegment = 
  | AIResponseTextSegment 
  | FileSegment 
  | ThinkSegment
  | ToolCallSegment;

export interface ParsedAIResponse {
  segments: AIResponseSegment[];
}