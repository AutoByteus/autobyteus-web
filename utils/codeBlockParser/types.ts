export interface ParsedFile {
  path: string;
  originalContent: string;
  highlightedContent?: string;
  language: string;
}

export interface FileGroup {
  files: ParsedFile[];
}

export interface AIResponseTextSegment {
  type: 'text';
  content: string;
}

export interface FileContentSegment {
  type: 'file_content';
  fileGroup: FileGroup;
}

export type AIResponseSegment = AIResponseTextSegment | FileContentSegment;

export interface ParsedAIResponse {
  segments: AIResponseSegment[];
}