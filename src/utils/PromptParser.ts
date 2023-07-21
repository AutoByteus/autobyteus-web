// src/utils/PromptParser.ts
export function parsePromptTemplate(template: string): Array<string | { placeholder: string }> {
    const regex = /\{([^\}]+)\}/g;
    let lastIndex = 0;
    const segments: Array<string | { placeholder: string }> = [];
  
    let match;
    while ((match = regex.exec(template)) !== null) {
      if (match.index > lastIndex) {
        segments.push(template.slice(lastIndex, match.index));
      }
      segments.push({ placeholder: match[1] });
      lastIndex = regex.lastIndex;
    }
  
    if (lastIndex < template.length) {
      segments.push(template.slice(lastIndex));
    }
  
    return segments;
  }
  