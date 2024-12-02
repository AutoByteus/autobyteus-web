import { v4 as uuidv4 } from 'uuid';

export default function plantumlPlugin(md: any) {
  const defaultRender = md.renderer.rules.fence || function(tokens: any, idx: number, options: any, env: any, self: any) {
    return self.renderToken(tokens, idx, options);
  };

  md.renderer.rules.fence = function(tokens: any, idx: number, options: any, env: any, self: any) {
    const token = tokens[idx];
    if (token.info.trim() === 'plantuml') {
      const content = token.content.trim();
      const diagramId = uuidv4(); // Generate unique ID for each diagram
      return `
        <div class="plantuml-diagram-container">
          <div class="plantuml-diagram" data-content="${encodeURIComponent(content)}" data-diagram-id="${diagramId}">
            <div class="loading-state">
              <svg class="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span class="mt-2">Generating diagram...</span>
            </div>
            <div class="error-state" style="display: none;">
              <span>Failed to generate diagram</span>
            </div>
            <div class="diagram-content" style="display: none;"></div>
          </div>
        </div>
      `;
    }
    return defaultRender(tokens, idx, options, env, self);
  };
}