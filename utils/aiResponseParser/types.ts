export interface ParsedFile {
  path: string;
  originalContent: string;
  highlightedContent?: string;
  language: string;
}

export interface BashCommands {
  commands: string[];
}

export interface ImplementationData {
  bashCommands: BashCommands;
  files: ParsedFile[];
}

export interface AIResponseTextSegment {
  type: 'text';
  content: string;
}

export interface FileContentSegment {
  type: 'file_content';
  fileGroup: {
    files: ParsedFile[];
  };
}

export interface BashCommandsSegment {
  type: 'bash_commands';
  commands: string[];
}

export type AIResponseSegment = AIResponseTextSegment | FileContentSegment | BashCommandsSegment;

export interface ParsedAIResponse {
  segments: AIResponseSegment[];
}