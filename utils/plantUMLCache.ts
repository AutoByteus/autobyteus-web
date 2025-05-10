// Global caches for PlantUML diagrams
// These persist across the application lifecycle.

// diagramId -> imageUrl (blob URL or data URL)
export const plantUMLSuccessCache = new Map<string, string>();

// diagramId -> errorMessage
export const plantUMLErrorCache = new Map<string, string>();

// Function to generate a hash ID for diagram content (from previous markdownItPlantuml.ts)
export const generateDiagramId = (content: string): string => {
  let hash = 0;
  if (content.length === 0) return 'puml-empty';
  
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Convert to positive hex string and add prefix
  return 'puml-' + Math.abs(hash).toString(16);
};
