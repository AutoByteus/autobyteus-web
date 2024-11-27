import Prism from 'prismjs';
import { highlightVueCode } from './vueCodeHighlight.js';
import type { ParsedAIResponse } from './types.js';

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
    // Text segments no longer need highlighting since we use MarkdownRenderer
    return segment;
  });

  return { segments: highlightedSegments };
}