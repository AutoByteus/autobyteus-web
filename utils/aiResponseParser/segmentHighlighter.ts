import Prism from 'prismjs';
import { highlightVueCode } from '~/utils/aiResponseParser/vueCodeHighlight';
import type { FileSegment } from '~/utils/aiResponseParser/types';

/**
 * Highlights the content of a file segment using Prism syntax highlighting
 * Special handling is provided for Vue files using the highlightVueCode function
 * 
 * @param fileSegment - The file segment to highlight
 * @returns A new file segment with highlighted content
 */
export function highlightFileSegment(fileSegment: FileSegment): FileSegment {
  if (!fileSegment.originalContent) {
    return fileSegment;
  }

  const highlightedContent = fileSegment.language.toLowerCase() === 'vue'
    ? highlightVueCode(fileSegment.originalContent)
    : Prism.highlight(
        fileSegment.originalContent,
        Prism.languages[fileSegment.language.toLowerCase()] || Prism.languages.plaintext,
        fileSegment.language.toLowerCase()
      );

  return {
    ...fileSegment,
    highlightedContent,
  };
}