import Prism from 'prismjs';
import { highlightVueCode } from '~/utils/aiResponseParser/vueCodeHighlight';
import type { AIResponseSegment } from '~/utils/aiResponseParser/types';

export function highlightSegments(segments: AIResponseSegment[]): AIResponseSegment[] {
  return segments.map(segment => {
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
}