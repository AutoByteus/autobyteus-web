
import { plantumlService } from '~/services/plantumlService';

export const usePlantUML = () => {
  // Track both successful and failed diagrams to prevent reprocessing
  const processedDiagrams = new Map<string, boolean>(); // diagramId -> success
  const blobUrls = new Set<string>();

  const cleanupBlobUrls = () => {
    blobUrls.forEach(url => {
      URL.revokeObjectURL(url);
    });
    blobUrls.clear();
  };

  const processPlantUmlDiagrams = async () => {
    const diagrams = document.querySelectorAll('.plantuml-diagram');
    
    for (const diagram of diagrams) {
      const content = decodeURIComponent(diagram.getAttribute('data-content') || '');
      const diagramId = diagram.getAttribute('data-diagram-id');
      
      // Skip if already attempted (whether successful or failed)
      if (!diagramId || processedDiagrams.has(diagramId)) {
        continue;
      }

      const loadingState = diagram.querySelector('.loading-state');
      const errorState = diagram.querySelector('.error-state');
      const diagramContent = diagram.querySelector('.diagram-content');
      
      if (!loadingState || !errorState || !diagramContent) continue;

      try {
        loadingState.style.display = 'flex';
        errorState.style.display = 'none';
        diagramContent.style.display = 'none';

        const imageBlob = await plantumlService.generateDiagram(content);
        const imageUrl = URL.createObjectURL(imageBlob);
        blobUrls.add(imageUrl);
        
        const img = new Image();
        
        img.onload = () => {
          loadingState.style.display = 'none';
          diagramContent.style.display = 'block';
          processedDiagrams.set(diagramId, true); // Mark as successfully processed
        };
        
        img.onerror = () => {
          loadingState.style.display = 'none';
          errorState.style.display = 'flex';
          URL.revokeObjectURL(imageUrl);
          blobUrls.delete(imageUrl);
          processedDiagrams.set(diagramId, false); // Mark as failed
        };
        
        img.src = imageUrl;
        img.alt = 'PlantUML diagram';
        img.className = 'max-w-full';
        
        diagramContent.innerHTML = '';
        diagramContent.appendChild(img);
      } catch (error) {
        console.error('Failed to process PlantUML diagram:', error);
        loadingState.style.display = 'none';
        errorState.style.display = 'flex';
        processedDiagrams.set(diagramId, false); // Mark as failed
      }
    }
  };

  const reset = () => {
    processedDiagrams.clear();
    cleanupBlobUrls();
  };

  return {
    processPlantUmlDiagrams,
    reset
  };
};
