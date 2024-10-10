import type { ParsedFile } from './types';
import { getLanguage } from './languageDetector';

function extractXMLString(text: string): string {
  const startTag = '<final_codes>';
  const endTag = '</final_codes>';
  const startIndex = text.indexOf(startTag);
  const endIndex = text.indexOf(endTag);

  if (startIndex === -1 || endIndex === -1) {
    throw new Error('XML content not found or incomplete');
  }

  return text.slice(startIndex, endIndex + endTag.length);
}

function parseFileEntry(file: Element): ParsedFile | null {
  const path = file.getAttribute('path') || '';
  const contentNode = file.getElementsByTagName('content')[0];
  let originalContent = '';

  if (contentNode) {
    const childNodes = contentNode.childNodes;
    for (let i = 0; i < childNodes.length; i++) {
      const node = childNodes[i];
      if (node.nodeType === Node.CDATA_SECTION_NODE || node.nodeType === Node.TEXT_NODE) {
        originalContent += node.nodeValue || '';
      }
    }
  }

  if (!path || !originalContent) {
    return null;
  }

  return {
    path,
    originalContent: originalContent.trim(),
    language: getLanguage(path)
  };
}

export function extractCodeBlocksFromXML(content: string): ParsedFile[] {
  try {
    const xmlContent = extractXMLString(content);
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'application/xml');

    const parseError = xmlDoc.getElementsByTagName('parsererror');
    if (parseError.length > 0) {
      throw new Error('Error parsing XML.');
    }

    const files = xmlDoc.getElementsByTagName('file');
    const result: ParsedFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const parsedFile = parseFileEntry(files[i]);
      if (parsedFile) {
        result.push(parsedFile);
      }
    }

    if (result.length === 0) {
      throw new Error('No code blocks extracted from XML.');
    }

    return result;
  } catch (error) {
    console.error('Error extracting code blocks from XML:', error);
    return [];
  }
}