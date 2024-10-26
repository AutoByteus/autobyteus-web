import { parseXmlImplementation } from './xmlImplementationParser';
import type { AIResponseSegment, ParsedAIResponse } from './types';

/**
 * Parses the AI response text into structured segments without performing any highlighting.
 * @param text - The AI response text containing possible implementation XML.
 * @returns A ParsedAIResponse object containing the segmented content.
 */
export function parseAIResponse(text: string): ParsedAIResponse {
  const segments: AIResponseSegment[] = [];
  let remainingText = text;

  while (remainingText.length > 0) {
    const xmlStartIndex = remainingText.indexOf('<implementation>');

    // If no more implementation blocks found, add remaining text as a segment and break
    if (xmlStartIndex === -1) {
      const finalText = remainingText.trim();
      if (finalText.length > 0) {
        segments.push({ type: 'text', content: finalText });
      }
      break;
    }

    // Add text before the implementation block if exists
    if (xmlStartIndex > 0) {
      const precedingText = remainingText.slice(0, xmlStartIndex).trim();
      if (precedingText.length > 0) {
        segments.push({ type: 'text', content: precedingText });
      }
    }

    // Find the end of current implementation block
    const xmlEndIndex = remainingText.indexOf('</implementation>', xmlStartIndex);
    
    if (xmlEndIndex === -1) {
      // If no closing tag found, treat the rest as text
      const remaining = remainingText.slice(xmlStartIndex).trim();
      if (remaining.length > 0) {
        segments.push({ type: 'text', content: remaining });
      }
      break;
    }

    // Extract and parse the implementation block
    const implementationContent = remainingText.slice(
      xmlStartIndex, 
      xmlEndIndex + '</implementation>'.length
    );

    try {
      const implementation = parseXmlImplementation(implementationContent);
      let addedSegments = 0;
      
      if (implementation.bashCommands.commands.length > 0) {
        segments.push({
          type: 'bash_commands',
          commands: implementation.bashCommands.commands,
        });
        addedSegments++;
      }

      if (implementation.files.length > 0) {
        segments.push({
          type: 'file_content',
          fileGroup: { files: implementation.files },
        });
        addedSegments++;
      }

      // If no segments were added from the implementation block, add an empty text segment
      if (addedSegments === 0) {
        segments.push({ type: 'text', content: '' });
      }

    } catch (error) {
      console.error('Implementation extraction failed:', error);
      segments.push({ type: 'text', content: implementationContent.trim() });
    }

    // Update the remaining text
    remainingText = remainingText.slice(xmlEndIndex + '</implementation>'.length).trim();
  }

  // If no segments were created, add the entire text as a single segment
  if (segments.length === 0) {
    segments.push({ type: 'text', content: text.trim() });
  }

  return { segments };
}