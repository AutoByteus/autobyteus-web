import type { ParsedFile } from '~/utils/codeBlockParser/types';
import { getLanguage } from '~/utils/codeBlockParser/languageDetector';

function extractContentBetweenTags(text: string): string {
  const startTag = '$FinalCodesStart$';
  const endTag = '$FinalCodesEnd$';
  const startIndex = text.indexOf(startTag);
  const endIndex = text.indexOf(endTag);

  if (startIndex === -1 || endIndex === -1) {
    throw new Error('Code block content not found or incomplete');
  }

  return text.slice(startIndex + startTag.length, endIndex).trim();
}

function parseFileEntry(entry: string): ParsedFile | null {
  const filePathRegex = /^File:\s*(.+)$/m;
  const pathMatch = entry.match(filePathRegex);

  if (!pathMatch) {
    return null;
  }

  const path = pathMatch[1].trim();
  const contentStartIndex = entry.indexOf('\n', pathMatch.index) + 1;
  let content = entry.slice(contentStartIndex).trim();

  content = content.replace(/^```\w*\n/, '').replace(/```$/, '').trim();

  const language = getLanguage(path);

  return {
    path,
    content,
    language
  };
}

export function extractCodeBlocksFromCustomTags(content: string): ParsedFile[] {
  const extractedContent = extractContentBetweenTags(content);
  const fileEntries = extractedContent.split(/(?=^File:)/m);

  return fileEntries
    .filter(entry => entry.trim() !== '')
    .map(entry => parseFileEntry(entry))
    .filter((entry): entry is ParsedFile => entry !== null);
}