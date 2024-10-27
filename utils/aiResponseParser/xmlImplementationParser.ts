import { getLanguage } from './languageDetector';
import type { ParsedFile, ImplementationData, BashCommands } from './types';

/**
 * Parses XML content to extract implementation details including bash commands and file information.
 * @param xmlContent - The XML string containing implementation data.
 * @returns An ImplementationData object containing bash commands and file information.
 * @throws Will throw an error if the XML parsing fails or the <implementation> tag is missing.
 */
export function parseXmlImplementation(xmlContent: string): ImplementationData {
  const xmlParser = new DOMParser();
  const xmlDocument = xmlParser.parseFromString(xmlContent, 'application/xml');

  const parseErrors = xmlDocument.getElementsByTagName('parsererror');
  if (parseErrors.length > 0) {
    throw new Error('Failed to parse XML implementation content.');
  }

  const implementationNode = xmlDocument.getElementsByTagName('implementation')[0];
  if (!implementationNode) {
    throw new Error('Required <implementation> tag not found in XML content.');
  }

  return {
    bashCommands: extractBashCommands(implementationNode),
    files: extractFiles(implementationNode)
  };
}

/**
 * Extracts bash commands from the implementation node, ignoring comment lines.
 * @param implementationNode - The XML implementation node.
 * @returns Object containing an array of bash commands.
 */
function extractBashCommands(implementationNode: Element): BashCommands {
  const bashCommandsNode = implementationNode.getElementsByTagName('bash_commands')[0];
  if (!bashCommandsNode || !bashCommandsNode.textContent) {
    return { commands: [] };
  }

  const commandLines = bashCommandsNode.textContent
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'));

  return {
    commands: commandLines
  };
}

/**
 * Extracts file information from the implementation node.
 * @param implementationNode - The XML implementation node.
 * @returns Array of ParsedFile objects containing file information.
 */
function extractFiles(implementationNode: Element): ParsedFile[] {
  const filesNode = implementationNode.getElementsByTagName('files')[0];
  if (!filesNode) {
    return [];
  }

  const fileElements = filesNode.getElementsByTagName('file');
  const parsedFiles: ParsedFile[] = [];

  for (let fileIndex = 0; fileIndex < fileElements.length; fileIndex++) {
    const fileElement = fileElements[fileIndex];
    const filePath = fileElement.getAttribute('path');
    const contentNode = fileElement.getElementsByTagName('content')[0];

    if (!filePath) {
      continue;
    }

    let fileContent = '';
    if (contentNode) {
      fileContent = extractFileContent(contentNode).trim();
    }

    parsedFiles.push({
      path: filePath,
      originalContent: fileContent,
      language: getLanguage(filePath)
    });
  }

  return parsedFiles;
}

/**
 * Extracts content from a file's content node, handling both CDATA and text nodes.
 * @param contentNode - The XML content node.
 * @returns The extracted content string or empty string if no content found.
 */
function extractFileContent(contentNode: Element): string {
  let extractedContent = '';

  for (let nodeIndex = 0; nodeIndex < contentNode.childNodes.length; nodeIndex++) {
    const node = contentNode.childNodes[nodeIndex];
    if (node.nodeType === Node.CDATA_SECTION_NODE || node.nodeType === Node.TEXT_NODE) {
      extractedContent += node.nodeValue || '';
    }
  }

  return extractedContent;
}