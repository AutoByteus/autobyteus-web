import Prism from 'prismjs';
import { highlightVueCode } from './vueCodeHighlight';
import { extractFileGroup } from './codeBlockExtractor';
import type { AIResponseSegment, ParsedAIResponse, FileGroup } from './types';

export function parseAIResponse(text: string): ParsedAIResponse {
  const segments: AIResponseSegment[] = [];
  let fileGroup: FileGroup;

  try {
    fileGroup = extractFileGroup(text);
  } catch (error) {
    console.error('File extraction failed:', error);
    segments.push({ type: 'text', content: text.trim() });
    return { segments };
  }

  let remainingText = text;
  const xmlStartIndex = remainingText.indexOf('<final_codes>');
  const xmlEndIndex = remainingText.indexOf('</final_codes>');

  if (xmlStartIndex > 0) {
    segments.push({ type: 'text', content: remainingText.slice(0, xmlStartIndex).trim() });
  }

  if (fileGroup.files.length > 0) {
    const highlightedFiles = fileGroup.files.map((file) => ({
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

    segments.push({
      type: 'file_content',
      fileGroup: { files: highlightedFiles },
    });
  }

  if (xmlEndIndex !== -1 && xmlEndIndex + '</final_codes>'.length < remainingText.length) {
    const finalText = remainingText.slice(xmlEndIndex + '</final_codes>'.length).trim();
    if (finalText) {
      segments.push({ type: 'text', content: finalText });
    }
  }

  return { segments };
}