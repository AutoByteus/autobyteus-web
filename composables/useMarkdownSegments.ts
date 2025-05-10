import { computed, Ref } from 'vue';
import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';
import { generateDiagramId } from '~/utils/plantUMLCache';
import { markdownItPrism } from '~/utils/markdownItPrism'; // Keep using this for non-PlantUML code blocks

export interface MarkdownSegment {
  type: 'html' | 'plantuml' | 'code';
  key: string; // For v-for
  content: string; // Generic content field
  language?: string; // For 'code' type
  diagramId?: string; // For 'plantuml' type
}

export const useMarkdownSegments = (markdownSource: Ref<string> | string) => {
  const md = new MarkdownIt({
    html: true,
    breaks: true,
    linkify: true,
    typographer: true,
  });

  // Use markdownItPrism for syntax highlighting of 'code' segments (non-PlantUML)
  // This plugin modifies the 'fence' rule. We need to be careful.
  // The strategy: let markdownItPrism handle regular code blocks.
  // For PlantUML, we'll have a custom rule or check `token.info`.

  const originalFenceRule = md.renderer.rules.fence;
  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const lang = token.info.trim().toLowerCase();
    if (lang === 'plantuml') {
      // This indicates a PlantUML block. We'll use this token type later.
      // For rendering, we'll output a special marker or nothing,
      // as the component will be inserted by Vue.
      // The actual HTML string from md.render() will be minimal for this.
      // Let's make it identifiable for splitting or special handling.
      return `<!-- PLANTUML_PLACEHOLDER_${generateDiagramId(token.content.trim())} -->`;
    }
    // For other languages, let markdownItPrism (if applied) or default rule handle it.
    if(originalFenceRule) {
        return originalFenceRule(tokens, idx, options, env, self);
    }
    return self.renderToken(tokens, idx, options); // Fallback
  };
  
  // Apply Prism plugin AFTER our custom fence rule might have been set,
  // or ensure Prism's rule calls ours if lang is not plantuml.
  // A safer way is to let Prism run, and then process its output, or
  // have Prism's rule explicitly ignore 'plantuml'.
  // For now, let's assume markdownItPrism is smart enough or we configure it.
  // The current markdownItPrism in context does not seem to allow ignoring specific langs.
  // Let's simplify: Prism will run on all fences. We'll extract PlantUML from its token, not its rendered output.

  // Re-initialize md for Prism to ensure clean rule setup
  const mdWithPrism = new MarkdownIt({
    html: true, breaks: true, linkify: true, typographer: true,
  }).use(markdownItPrism); // Prism for syntax highlighting of normal code blocks

  const parsedSegments = computed(() => {
    const sourceString = typeof markdownSource === 'string' ? markdownSource : markdownSource.value;
    const segments: MarkdownSegment[] = [];
    let segmentKey = 0;

    const tokens = md.parse(sourceString, {}); // Use the md without Prism for tokenizing

    let currentBatchOfTokens: any[] = [];

    function flushBatchToHtmlSegment() {
      if (currentBatchOfTokens.length > 0) {
        // Render these tokens using mdWithPrism to get highlighted code blocks
        const html = mdWithPrism.renderer.render(currentBatchOfTokens, mdWithPrism.options, {});
        const sanitizedHtml = DOMPurify.sanitize(html, { 
            ADD_ATTR: ['class', 'style'], // Allow classes from Prism and inline styles if any
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
