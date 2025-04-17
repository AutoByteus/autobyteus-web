// We'll use a simple hashing function to create IDs based on content
const generateHashId = (str: string): string => {
  let hash = 0;
  if (str.length === 0) return hash.toString();
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Convert to positive hex string and add prefix
  return 'puml-' + Math.abs(hash).toString(16);
};

export default function plantumlPlugin(md: any) {
  const fence = md.renderer.rules.fence!;

  md.renderer.rules.fence = function(tokens: any, idx: number, options: any, env: any, self: any) {
    const token = tokens[idx];
    if (token.info.trim() === 'plantuml') {
      const content = token.content.trim();
      // Generate deterministic ID based on content
      const diagramId = generateHashId(content);
      
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
              <svg class="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
              <span class="error-message mt-2 text-red-600">Failed to generate diagram</span>
            </div>
            <div class="diagram-content" style="display: none;"></div>
          </div>
        </div>
      `;
    }
    // Fallback to default fence rendering
    return fence(tokens, idx, options, env, self);
  };
}
