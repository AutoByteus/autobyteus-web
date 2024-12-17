import { getLanguage } from '~/utils/aiResponseParser/languageDetector';
import type { ParsedFile, BashCommand } from '~/utils/aiResponseParser/types';

/**
 * Parses individual XML segments to extract bash commands or file information.
 * @param xmlContent - The XML string containing either a bash command or file definition.
 * @returns An object representing either a BashCommand or a ParsedFile.
 * @throws Will throw an error if the XML parsing fails or required tags are missing.
 */
export function parseXmlSegment(xmlContent: string): BashCommand | ParsedFile {
  const parser = new DOMParser();
  const xmlDocument = parser.parseFromString(xmlContent, 'application/xml');

  const parseErrors = xmlDocument.getElementsByTagName('parsererror');
  if (parseErrors.length > 0) {
    throw new Error('Failed to parse XML segment content.');
  }

  if (xmlContent.startsWith('<bash')) {
    return extractBashCommand(xmlDocument);
  } else if (xmlContent.startsWith('<file')) {
    return extractFile(xmlDocument);
  } else {
    throw new Error('Unknown XML segment type.');
  }
}

/**
 * Extracts bash command from the XML document.
 * @param xmlDocument - The parsed XML document containing a bash command.
 * @returns A BashCommand object.
 */
function extractBashCommand(xmlDocument: Document): BashCommand {
  const bashNode = xmlDocument.getElementsByTagName('bash')[0];
  if (!bashNode) {
    throw new Error('Required <bash> tag not found in XML segment.');
  }

  const command = bashNode.getAttribute('command');
  const description = bashNode.getAttribute('description');

  if (!command) {
    throw new Error('Bash command is missing the "command" attribute.');
  }

  return {
    command,
    description: description || '',
  };
}

/**
 * Extracts file information from the XML document.
 * @param xmlDocument - The parsed XML document containing a file definition.
 * @returns A ParsedFile object.
 */
function extractFile(xmlDocument: Document): ParsedFile {
  const fileNode = xmlDocument.getElementsByTagName('file')[0];
  if (!fileNode) {
    throw new Error('Required <file> tag not found in XML segment.');
  }

  const filePath = fileNode.getAttribute('path');

  if (!filePath) {
    throw new Error('File is missing the "path" attribute.');
  }

  const cdataSection = Array.from(fileNode.childNodes).find(node => node.nodeType === Node.CDATA_SECTION_NODE);
  const fileContent = cdataSection && cdataSection.nodeValue ? cdataSection.nodeValue.trim() : '';

  return {
    path: filePath,
    originalContent: fileContent,
    language: getLanguage(filePath),
  };
}