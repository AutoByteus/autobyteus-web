/**
 * Segment Types - Types for AI response segments.
 * 
 * These types define the different kinds of content segments that can appear
 * in an AI message (text, files, tool calls, etc.). They are used by both
 * the streaming service handlers and the UI components.
 */

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
  rawContent?: string;
}

export interface BashCommandSegment {
  type: 'bash_command';
  command: string;
  description: string;
}

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

export interface MediaSegment {
  type: 'media';
  mediaType: 'image' | 'audio' | 'video';
  urls: string[];
}

export interface IframeSegment {
  type: 'iframe';
  content: string;
  isComplete: boolean;
}

export interface ErrorSegment {
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
