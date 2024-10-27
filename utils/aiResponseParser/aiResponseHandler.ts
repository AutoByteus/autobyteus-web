import { parseAIResponse } from './aiResponseSegmentParser.js';
import { highlightSegments } from './segmentHighlighter.js';
import type { ParsedAIResponse } from './types.js';

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