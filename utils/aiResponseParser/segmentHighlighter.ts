import Prism from 'prismjs';
import { highlightVueCode } from './vueCodeHighlight';
import type { ParsedAIResponse } from './types';

/**
 * Highlights the code content within the parsed AI response segments.
 * @param parsed - The ParsedAIResponse object containing the segmented content.
 * @returns A ParsedAIResponse object with highlighted code where applicable.
 */
export function highlightSegments(parsed: ParsedAIResponse): ParsedAIResponse {
  const highlightedSegments = parsed.segments.map(segment => {
    if (segment.type === 'file_content') {
      const highlightedFiles = segment.fileGroup.files.map(file => ({
        ...file,
        highlightedContent:
          file.language.toLowerCase() === 'vue'
            ? highlightVueCode(file.originalContent)
            : Prism.highlight(
                file.originalContent,
                Prism.languages[file.language.toLowerCase()] || Prism.languages.plaintext,
                file.language.toLowerCase()
              ),
      }));
      return {
        ...segment,
        fileGroup: { files: highlightedFiles },
      };
    }
    return segment;
  });

  return { segments: highlightedSegments };
}