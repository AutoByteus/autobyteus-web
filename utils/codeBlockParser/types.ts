// This file defines the types used for parsing and representing AI responses

export interface ParsedFile {
  path: string;
  originalContent: string;
  highlightedContent?: string;
  language: string;
}

// AIResponseSegment represents different types of content in an AI response
export type AIResponseSegment =
  | AIResponseTextSegment
  | FileContentSegment
  // Add more segment types here in the future, e.g., AIResponseCommandSegment

// Base interface for all AI response segments
interface BaseAIResponseSegment {
  type: string;
}

// Represents a segment of plain text in the AI response
export interface AIResponseTextSegment extends BaseAIResponseSegment {
  type: 'text';
  content: string;
}

// Represents a segment containing file content (code blocks) in the AI response
export interface FileContentSegment extends BaseAIResponseSegment {
  type: 'file_content';
  files: ParsedFile[];
}

// Represents the entire parsed AI response
export interface ParsedAIResponse {
  segments: AIResponseSegment[];
}