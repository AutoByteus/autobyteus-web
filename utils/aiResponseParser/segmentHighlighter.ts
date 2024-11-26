import Prism from 'prismjs';
import { highlightVueCode } from './vueCodeHighlight.js';
import type { ParsedAIResponse } from './types.js';

/**
 * Highlights the code content within the parsed AI response segments.
 * @param parsed - The ParsedAIResponse object containing the segmented content.
 * @returns A ParsedAIResponse object with highlighted code where applicable.
 */
export function highlightSegments(parsed: ParsedAIResponse): ParsedAIResponse {
  const highlightedSegments = parsed.segments.map(segment => {
    if (segment.type === 'file') {
      const highlightedContent =
        segment.language.toLowerCase() === 'vue'
          ? highlightVueCode(segment.originalContent)
          : Prism.highlight(
              segment.originalContent,
              Prism.languages[segment.language.toLowerCase()] || Prism.languages.plaintext,
              segment.language.toLowerCase()
            );
      return {
        ...segment,
        highlightedContent,
      };
    }
    return segment;
  });

  return { segments: highlightedSegments };
}