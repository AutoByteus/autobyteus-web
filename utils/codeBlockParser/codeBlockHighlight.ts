import Prism from 'prismjs';
import { highlightVueCode } from '~/utils/codeBlockParser/vueCodeHighlight';
import { extractCodeBlocks } from '~/utils/codeBlockParser/codeBlockExtractor';
import type { ParsedFile, AIResponseSegment, ParsedAIResponse } from './types';

/**
 * Parses an AI response text and extracts code blocks and text segments
 * @param text The raw AI response text
 * @returns A ParsedAIResponse object containing an array of AIResponseSegments
 */
export function parseAIResponse(text: string): ParsedAIResponse {
  const segments: AIResponseSegment[] = [];
  let codeBlocks: ParsedFile[] = [];

  try {
    // Extract code blocks from the text
    codeBlocks = extractCodeBlocks(text);
    console.log('Code blocks extracted:', codeBlocks);
  } catch (error) {
    console.error('Code extraction failed:', error);
    // If extraction fails, treat the entire text as a single text segment
    segments.push({ type: 'text', content: text.trim() });
    return { segments };
  }

  let remainingText = text;

  // Process each extracted code block
  codeBlocks.forEach((codeBlock) => {
    const filePathIndex = remainingText.indexOf(`File: ${codeBlock.path}`);
    if (filePathIndex > -1) {
      // Add any text before the code block as a text segment
      const precedingText = remainingText.slice(0, filePathIndex).trim();
      if (precedingText) {
        segments.push({ type: 'text', content: precedingText });
      }

      // Highlight the code based on its language
      const highlightedCode =
        codeBlock.language.toLowerCase() === 'vue'
          ? highlightVueCode(codeBlock.content)
          : Prism.highlight(
              codeBlock.content.trim(),
              Prism.languages[codeBlock.language.toLowerCase()] || Prism.languages.plaintext,
              codeBlock.language.toLowerCase()
            );

      // Add the code block as a file content segment
      segments.push({
        type: 'file_content',
        files: [{
          ...codeBlock,
          content: highlightedCode,
        }],
      });

      // Update the remaining text
      const codeContentIndex = remainingText.indexOf(codeBlock.content);
      if (codeContentIndex !== -1) {
        remainingText = remainingText.slice(codeContentIndex + codeBlock.content.length);
      }
    }
  });

  // Add any remaining text as a final text segment
  const finalText = remainingText.trim();
  if (finalText) {
    segments.push({ type: 'text', content: finalText });
  }

  return { segments };
}