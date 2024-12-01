import { parseXmlSegment } from './xmlImplementationParser.js';
import { highlightSegments } from './segmentHighlighter.js';
import type { AIResponseSegment, ParsedAIResponse, BashCommand, ParsedFile } from './types.js';

/**
 * Handles the raw AI response by parsing and then highlighting it.
 * @param rawContent - The raw AI response text.
 * @returns A ParsedAIResponse object containing highlighted segments.
 */
export function handleAIResponse(rawContent: string): ParsedAIResponse {
  const parsed = parseAIResponse(rawContent);
  const highlighted = highlightSegments(parsed);
  return highlighted;
}

/**
 * Parses the AI response text into a sequential list of segments, handling individual bash commands and files.
 * @param text - The AI response text containing possible bash commands and file definitions.
 * @returns A ParsedAIResponse object containing the segmented content.
 */
export function parseAIResponse(text: string): ParsedAIResponse {
  const segments: AIResponseSegment[] = [];
  let remainingText = text;

  while (remainingText.length > 0) {
    const bashStartIndex = remainingText.indexOf('<bash');
    const fileStartIndex = remainingText.indexOf('<file');
    const nextTagIndex = findNextTagIndex(bashStartIndex, fileStartIndex);
    let tagType: 'bash' | 'file' | null = null;

    if (nextTagIndex === -1) {
      const finalText = remainingText.trim();
      if (finalText.length > 0) {
        segments.push({ type: 'text', content: finalText });
      }
      break;
    }

    if (nextTagIndex > 0) {
      const precedingText = remainingText.slice(0, nextTagIndex).trim();
      if (precedingText.length > 0) {
        segments.push({ type: 'text', content: precedingText });
      }
    }

    if (bashStartIndex !== -1 && bashStartIndex === nextTagIndex) {
      tagType = 'bash';
    } else if (fileStartIndex !== -1 && fileStartIndex === nextTagIndex) {
      tagType = 'file';
    }

    if (tagType === 'bash') {
      const bashEndIndex = remainingText.indexOf('/>', bashStartIndex);
      if (bashEndIndex === -1) {
        const remaining = remainingText.slice(bashStartIndex).trim();
        if (remaining.length > 0) {
          segments.push({ type: 'text', content: remaining });
        }
        break;
      }

      const bashContent = remainingText.slice(bashStartIndex, bashEndIndex + '/>'.length);
      try {
        const bashCommand: BashCommand = parseXmlSegment(bashContent) as BashCommand;
        if (bashCommand.command.trim() !== '') {
          segments.push({
            type: 'bash_command',
            command: bashCommand.command,
            description: bashCommand.description,
          });
        }
      } catch (error) {
        console.error('Bash command extraction failed:', error);
        segments.push({ type: 'text', content: bashContent.trim() });
      }

      remainingText = remainingText.slice(bashEndIndex + '/>'.length).trim();
    } else if (tagType === 'file') {
      const fileEndIndex = remainingText.indexOf('</file>', fileStartIndex);
      if (fileEndIndex === -1) {
        const remaining = remainingText.slice(fileStartIndex).trim();
        if (remaining.length > 0) {
          segments.push({ type: 'text', content: remaining });
        }
        break;
      }

      const fileContent = remainingText.slice(fileStartIndex, fileEndIndex + '</file>'.length);
      try {
        const file: ParsedFile = parseXmlSegment(fileContent) as ParsedFile;
        segments.push({
          type: 'file',
          path: file.path,
          originalContent: file.originalContent,
          language: file.language,
        });
      } catch (error) {
        console.error('File content extraction failed:', error);
        segments.push({ type: 'text', content: fileContent.trim() });
      }

      remainingText = remainingText.slice(fileEndIndex + '</file>'.length).trim();
    }
  }

  if (segments.length === 0) {
    segments.push({ type: 'text', content: text.trim() });
  }

  return { segments };
}

/**
 * Determines the next tag index between bash and file tags.
 * @param bashIndex - The index of the next <bash> tag.
 * @param fileIndex - The index of the next <file> tag.
 * @returns The smallest index or -1 if neither is found.
 */
function findNextTagIndex(bashIndex: number, fileIndex: number): number {
  if (bashIndex === -1 && fileIndex === -1) return -1;
  if (bashIndex === -1) return fileIndex;
  if (fileIndex === -1) return bashIndex;
  return Math.min(bashIndex, fileIndex);
}