import type MarkdownIt from 'markdown-it';

export default function markdownItPlantuml(md: MarkdownIt) {
  const defaultFence = md.renderer.rules.fence || function (tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
  };

  md.renderer.rules.fence = function (tokens, idx, options, env, self) {
    const token = tokens[idx];
    const code = token.content.trim();
    
    if (token.info.trim().toLowerCase().startsWith('plantuml')) {
      const diagramId = `plantuml-${Math.random().toString(36).substr(2, 9)}`;
      const encodedContent = encodeURIComponent(code);
      return `<div class="plantuml-diagram-container">
                <div class="plantuml-diagram" id="${diagramId}" data-content="${encodedContent}">
                  <div class="loading-state">
                    <svg class="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span class="mt-2 text-sm">Generating diagram...</span>
                  </div>
                  <div class="error-state" style="display:none;">
                    <svg class="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span class="mt-2 text-sm text-red-600">Failed to load diagram</span>
                  </div>
                  <div class="diagram-content"></div>
                </div>
              </div>`;
    }
    return defaultFence(tokens, idx, options, env, self);
  };
}