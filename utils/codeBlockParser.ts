import Prism from 'prismjs';
import { highlightVueCode } from '~/utils/codeHighlight';

export interface ParsedFile {
  path: string;
  content: string;
  language: string;
}

export interface ParsedCodeBlock {
  type: 'text' | 'code';
  content: string;
  path?: string;
  highlightedCode?: string;
  language?: string;
}

// Function to extract content between $FinalCodesStart$ and $FinalCodesEnd$
export function extractContentBetweenTags(text: string): string {
  const startTag = '$FinalCodesStart$';
  const endTag = '$FinalCodesEnd$';
  const startIndex = text.indexOf(startTag);
  const endIndex = text.indexOf(endTag);

  if (startIndex === -1 || endIndex === -1) {
    throw new Error('Code block content not found or incomplete');
  }

  return text.slice(startIndex + startTag.length, endIndex).trim();
}

// Function to parse individual file entries
export function parseFileEntry(entry: string): ParsedFile {
  const filePathRegex = /^File:\s*(.+)$/m;
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/;

  const pathMatch = entry.match(filePathRegex);
  const contentMatch = entry.match(codeBlockRegex);

  if (!pathMatch || !contentMatch) {
    throw new Error('Invalid file entry format');
  }

  const path = pathMatch[1].trim();
  const content = contentMatch[2].trim();
  const language = getLanguage(path);

  return {
    path,
    content,
    language
  };
}

// Function to extract code blocks from tagged content
export function extractCodeBlocksFromTags(content: string): ParsedFile[] {
  const extractedContent = extractContentBetweenTags(content);
  const fileEntries = extractedContent.split(/(?=File:)/);

  return fileEntries
    .filter(entry => entry.trim() !== '')
    .map(entry => parseFileEntry(entry));
}

// Function to extract XML string
export function extractXMLString(text: string): string {
  const startTag = '<final_codes>';
  const endTag = '</final_codes>';
  const startIndex = text.indexOf(startTag);
  const endIndex = text.indexOf(endTag);

  if (startIndex === -1 || endIndex === -1) {
    throw new Error('XML content not found or incomplete');
  }

  return text.slice(startIndex, endIndex + endTag.length);
}

// Function to extract code blocks from XML content
export function extractCodeBlocksFromXML(content: string): ParsedFile[] {
  const xmlContent = extractXMLString(content);

  // Check if DOMParser is available (browser environment)
  if (typeof DOMParser !== 'undefined') {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'application/xml');

    const parseError = xmlDoc.getElementsByTagName('parsererror');
    if (parseError.length > 0) {
      throw new Error('Error parsing XML.');
    }

    const files = xmlDoc.getElementsByTagName('file');
    const result: ParsedFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const path = file.getAttribute('path') || '';
      const contentNode = file.getElementsByTagName('content')[0];
      let codeContent = '';

      if (contentNode) {
        // Handle CDATA sections
        const cdataSections = contentNode.childNodes;
        for (let j = 0; j < cdataSections.length; j++) {
          const node = cdataSections[j];
          if (node.nodeType === Node.CDATA_SECTION_NODE) {
            codeContent += node.nodeValue || '';
          } else {
            codeContent += node.textContent || '';
          }
        }
      }

      result.push({ path, content: codeContent.trim(), language: getLanguage(path) });
    }

    if (result.length === 0) {
      throw new Error('No code blocks extracted from XML.');
    }

    return result;
  } else {
    // Fallback for non-browser environments (e.g., Node.js)
    console.warn('DOMParser not available. XML parsing might not work as expected.');
    throw new Error('DOMParser not available.');
  }
}

// Function to get language based on file extension
export const getLanguage = (filePath: string): string => {
  const extension = filePath.split('.').pop()?.toLowerCase() || '';
  switch (extension) {
    case 'py':
      return 'python';
    case 'ts':
      return 'typescript';
    case 'js':
      return 'javascript';
    case 'vue':
      return 'vue';
    case 'html':
      return 'markup';
    case 'php':
      return 'php';
    default:
      return 'plaintext';
  }
};

// Function to parse AI responses
export function parseAIResponse(text: string): ParsedCodeBlock[] {
  const result: ParsedCodeBlock[] = [];
  let codeBlocks: ParsedFile[] = [];
  let formatDetected = '';

  if (text.includes('<final_codes>')) {
    formatDetected = 'xml';
  } else if (text.includes('$FinalCodesStart$')) {
    formatDetected = 'tag';
  }

  try {
    if (formatDetected === 'xml') {
      codeBlocks = extractCodeBlocksFromXML(text);
      console.log('Code blocks extracted from XML:', codeBlocks);
    } else if (formatDetected === 'tag') {
      codeBlocks = extractCodeBlocksFromTags(text);
      console.log('Code blocks extracted from tags:', codeBlocks);
    } else {
      // Neither format detected, treat entire text as plain text
      result.push({ type: 'text', content: text.trim() });
      return result;
    }
  } catch (error) {
    console.error('Code extraction failed:', error);
    // If extraction fails, treat entire text as plain text
    result.push({ type: 'text', content: text.trim() });
    return result;
  }

  let remainingText = text;

  codeBlocks.forEach((codeBlock) => {
    const filePathIndex = remainingText.indexOf(`File: ${codeBlock.path}`);
    if (filePathIndex > -1) {
      // Extract and push the text before the current code block
      const precedingText = remainingText.slice(0, filePathIndex).trim();
      if (precedingText) {
        result.push({ type: 'text', content: precedingText });
      }

      // Highlight the code using Prism
      const highlightedCode =
        codeBlock.language.toLowerCase() === 'vue'
          ? highlightVueCode(codeBlock.content)
          : Prism.highlight(
              codeBlock.content.trim(),
              Prism.languages[codeBlock.language.toLowerCase()] || Prism.languages.plaintext,
              codeBlock.language.toLowerCase()
            );

      // Push the code block
      result.push({
        type: 'code',
        path: codeBlock.path,
        content: codeBlock.content,
        highlightedCode,
        language: codeBlock.language.toLowerCase(),
      });

      // Update the remainingText to exclude the processed code block
      const codeContentIndex = remainingText.indexOf(codeBlock.content);
      if (codeContentIndex !== -1) {
        remainingText = remainingText.slice(codeContentIndex + codeBlock.content.length);
      }
    }
  });

  // Push any remaining text after the last code block
  const finalText = remainingText.trim();
  if (finalText) {
    result.push({ type: 'text', content: finalText });
  }

  return result;
}
