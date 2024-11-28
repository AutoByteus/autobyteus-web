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
  highlightedContent?: string;
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

export type AIResponseSegment = AIResponseTextSegment | BashCommandSegment | FileSegment;

export interface ParsedAIResponse {
  segments: AIResponseSegment[];
}