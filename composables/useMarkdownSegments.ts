import { computed } from 'vue';
import type { Ref } from 'vue';
import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';
import { katex } from '@mdit/plugin-katex';
import { generateDiagramId } from '~/utils/plantUMLCache';
import { normalizeMath } from '~/utils/markdownMath';
import { markdownItPrism } from '~/utils/markdownItPrism'; // Keep using this for non-PlantUML code blocks

export interface MarkdownSegment {
  type: 'html' | 'plantuml' | 'code';
  key: string; // For v-for
  content: string; // Generic content field
  language?: string; // For 'code' type
  diagramId?: string; // For 'plantuml' type
}

export const useMarkdownSegments = (markdownSource: Ref<string> | string) => {
  // Support both $...$ and \\(...\\)/\\[...\\] delimiters so messages coming
  // from different providers render consistently.
  const katexOptions = {
    delimiters: 'all' as const, // dollars + bracket delimiters (\(...\), \[...\])
  };

  // Instance for tokenizing structure
  const md = new MarkdownIt({
    html: true,
    breaks: true,
    linkify: true,
    typographer: true,
  });

  // Enable KaTeX on the tokenizer
  md.use(katex, katexOptions);

  // Use markdownItPrism for syntax highlighting of 'code' segments (non-PlantUML)
  // This plugin modifies the 'fence' rule. We need to be careful.
  
  const originalFenceRule = md.renderer.rules.fence;
  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const lang = token.info.trim().toLowerCase();
    if (lang === 'plantuml') {
      // This indicates a PlantUML block.
      return `<!-- PLANTUML_PLACEHOLDER_${generateDiagramId(token.content.trim())} -->`;
    }
    // For other languages, let markdownItPrism (if applied) or default rule handle it.
    if(originalFenceRule) {
        return originalFenceRule(tokens, idx, options, env, self);
    }
    return self.renderToken(tokens, idx, options); // Fallback
  };
  
  // Re-initialize md for Prism to ensure clean rule setup, and include KaTeX for rendering math
  const mdWithPrism = new MarkdownIt({
    html: true, breaks: true, linkify: true, typographer: true,
  })
  .use(markdownItPrism) // Prism for syntax highlighting of normal code blocks
  .use(katex, katexOptions); // KaTeX for rendering math tokens

  const parsedSegments = computed(() => {
    const sourceStringRaw = typeof markdownSource === 'string' ? markdownSource : markdownSource.value;
    const sourceString = normalizeMath(sourceStringRaw);
    const segments: MarkdownSegment[] = [];
    let segmentKey = 0;

    const tokens = md.parse(sourceString, {}); // Use the md without Prism for tokenizing

    let currentBatchOfTokens: any[] = [];

    function flushBatchToHtmlSegment() {
      if (currentBatchOfTokens.length > 0) {
        // Render these tokens using mdWithPrism to get highlighted code blocks and math formulas
        const html = mdWithPrism.renderer.render(currentBatchOfTokens, mdWithPrism.options, {});
        
        // Sanitize the HTML. 
        // Note: KaTeX produces safe HTML with classes and inline styles (if configured), 
        // but DOMPurify needs to allow them.
        const sanitizedHtml = DOMPurify.sanitize(html, { 
            ADD_ATTR: ['class', 'style'], // Allow classes from Prism/KaTeX and inline styles if any
            ADD_TAGS: ['math', 'semantics', 'mrow', 'mi', 'mo', 'mn', 'msup', 'msub', 'annotation', 'mtext'], // Allow MathML tags if KaTeX outputs them
            USE_PROFILES: { html: true } 
        });
        if (sanitizedHtml.trim()) {
            segments.push({ type: 'html', content: sanitizedHtml, key: `segment-${segmentKey++}` });
        }
        currentBatchOfTokens = [];
      }
    }

    for (const token of tokens) {
      if (token.type === 'fence' && token.info.trim().toLowerCase() === 'plantuml') {
        flushBatchToHtmlSegment(); // Render preceding tokens as HTML
        const plantUMLContent = token.content.trim();
        segments.push({
          type: 'plantuml',
          content: plantUMLContent,
          diagramId: generateDiagramId(plantUMLContent),
          key: `segment-${segmentKey++}`,
        });
      } else {
        currentBatchOfTokens.push(token);
      }
    }
    flushBatchToHtmlSegment(); // Render any remaining tokens

    return segments;
  });

  return {
    parsedSegments,
  };
};
