import type MarkdownIt from 'markdown-it';

export default function markdownItPlantuml(md: MarkdownIt) {
  const defaultFence = md.renderer.rules.fence || function (tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
  };

  md.renderer.rules.fence = function (tokens, idx, options, env, self) {
    const token = tokens[idx];
    const code = token.content.trim();
    
    // Check if the code block is a PlantUML diagram
    if (token.info.trim().toLowerCase().startsWith('plantuml')) {
      const diagramId = `plantuml-${Math.random().toString(36).substr(2, 9)}`;
      const encodedContent = encodeURIComponent(code);
      return `<div class="plantuml-diagram" id="${diagramId}" data-content="${encodedContent}">
                <div class="loading">Loading diagram...</div>
                <div class="error" style="display:none;color:red;"></div>
              </div>`;
    }
    return defaultFence(tokens, idx, options, env, self);
  };
}