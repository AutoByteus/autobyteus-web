import { extractCodeBlocksFromXML } from './xmlCodeBlockParser';
import type { FileGroup } from './types';

export function extractFileGroup(content: string): FileGroup {
  const parsedFiles = extractCodeBlocksFromXML(content);
  return { files: parsedFiles };
}