import type { ParsedFile } from '~/utils/codeBlockParser/types';
import { extractCodeBlocksFromCustomTags } from '~/utils/codeBlockParser/customTagCodeBlockParser';
import { extractCodeBlocksFromXML } from '~/utils/codeBlockParser/xmlCodeBlockParser';

export function extractCodeBlocks(content: string): ParsedFile[] {
  if (content.includes('<final_codes>')) {
    return extractCodeBlocksFromXML(content);
  } else if (content.includes('$FinalCodesStart$')) {
    return extractCodeBlocksFromCustomTags(content);
  } else {
    throw new Error('No recognized code block format found');
  }
}