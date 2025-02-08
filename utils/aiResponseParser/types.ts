/* autobyteus-web/utils/aiResponseParser/types.ts */

export interface BashCommand {
  command: string;
  description: string;
}

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

export interface BashCommandSegment {
  type: 'bash_command';
  command: string;
  description: string;
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

export type AIResponseSegment = 
  | AIResponseTextSegment 
  | BashCommandSegment 
  | FileSegment 
  | ThinkSegment;

export interface ParsedAIResponse {
  segments: AIResponseSegment[];
}