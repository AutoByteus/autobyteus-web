import highlightService from '~/services/highlightService';
import type { FileSegment } from '~/utils/aiResponseParser/types';

/**
 * Highlights the content of a file segment using syntax highlighting
 * Special handling is provided for Vue files
 * 
 * @param fileSegment - The file segment to highlight
 * @returns A new file segment with highlighted content
 */
export function highlightFileSegment(fileSegment: FileSegment): FileSegment {
  if (!fileSegment.originalContent) {
    return fileSegment;
  }

  const highlightedContent = fileSegment.language.toLowerCase() === 'vue'
    ? highlightService.highlightVue(fileSegment.originalContent)
    : highlightService.highlight(
        fileSegment.originalContent,
        fileSegment.language.toLowerCase()
      );

  return {
    ...fileSegment,
    highlightedContent,
  };
}
